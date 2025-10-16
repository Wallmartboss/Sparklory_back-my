import { InTokensGenerate } from '@/common';
import { SessionService } from '@/session/session.service';
import { VerifyEmailDto } from '@/user/dto/verify-email.dto';
import { User } from '@/user/schema/user.schema';
import { UserService } from '@/user/user.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    readonly jwtService: JwtService,
    private configService: ConfigService,
    readonly userService: UserService,
    readonly sessionService: SessionService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async verifyUserEmail(payload: VerifyEmailDto) {
    const { email, role, id, name, sessionId, deviceId } =
      await this.userService.verifyUserEmail(payload);

    const tokensPayload: InTokensGenerate = {
      email,
      role,
      id,
      name,
      sessionId,
      deviceId,
    };

    const { accessToken, refreshToken } =
      await this.generateTokens(tokensPayload);
    return { accessToken, refreshToken, deviceId };
  }

  async generateTokens(payload: InTokensGenerate) {
    const { email, role, id, name, sessionId, deviceId } = payload;
    const tokenPayload = { email, role, sub: id, sessionId, deviceId };

    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(tokenPayload),

      await this.jwtService.signAsync(
        {
          ...tokenPayload,
          name: name,
        },
        {
          expiresIn: '7d',
          secret: this.configService.get<string>('REFRESH_JWT_SECRET'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async createNewDevice(user: User) {
    const verifyDeviceCode = crypto.randomBytes(2).toString('hex');
    user.verifyDeviceCode = verifyDeviceCode;

    return await this.userService.addNewDevice(user);
  }

  async login(user: User, deviceId?: string, verifyDeviceCode?: string) {
    if (verifyDeviceCode) {
      if (user.verifyDeviceCode !== verifyDeviceCode) {
        throw new BadRequestException('Wrong code!');
      }
      user.verifyDeviceCode = null;
    }

    const newSession = await this.sessionService.create(
      user._id as Types.ObjectId,
    );

    user.sessions.push(newSession);
    user.isLoggedIn = true;

    await this.userService.saveUser(user);

    const payload: InTokensGenerate = {
      email: user.email,
      role: user.role,
      id: user.id,
      name: user.name,
      sessionId: newSession.id,
      deviceId,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);

    return {
      loggedInUser: user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Validate or create user via OAuth (Facebook/Google)
   */
  async validateOAuthLogin({
    provider,
    providerId,
    email,
    name,
    photo,
  }: {
    provider: 'facebook' | 'google';
    providerId: string;
    email?: string;
    name?: string;
    photo?: string;
  }): Promise<User> {
    let user: User | null = null;
    if (provider === 'facebook') {
      user = await this.userService.findOneByParams({ facebookId: providerId });
    } else if (provider === 'google') {
      user = await this.userService.findOneByParams({ googleId: providerId });
    }
    if (!user && email) {
      user = await this.userService.findByEmail(email);
    }
    if (!user) {
      // Create new user
      user = await this.userService.createUser({
        email,
        name: name || email?.split('@')[0],
        image: photo,
        facebookId: provider === 'facebook' ? providerId : undefined,
        googleId: provider === 'google' ? providerId : undefined,
        isVerifyEmail: true,
        password: '',
      });
    } else {
      // Link social ID if not saved
      if (provider === 'facebook' && !user.facebookId) {
        user.facebookId = providerId;
      }
      if (provider === 'google' && !user.googleId) {
        user.googleId = providerId;
      }
      await this.userService.saveUser(user);
    }
    return user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token using refresh secret
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('REFRESH_JWT_SECRET'),
      });

      // Check if session still exists and user is logged in
      const session = await this.sessionService.findOneForJwt(
        payload.sub,
        payload.sessionId,
      );

      if (!session || !session.user.isLoggedIn) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokenPayload: InTokensGenerate = {
        email: payload.email,
        role: payload.role,
        id: payload.sub,
        name: payload.name,
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
      };

      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(tokenPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, sessionId: string) {
    try {
      // Find and validate session
      const session = await this.sessionService.findOneForJwt(
        userId,
        sessionId,
      );

      if (!session) {
        throw new BadRequestException('Session not found');
      }

      // Mark session as deleted
      session.deletedAt = new Date().toISOString();
      await session.save();

      // Update user login status if this was the last active session
      const user = session.user as any;
      const activeSessions = user.sessions.filter(
        (s: any) => !s.deletedAt && s._id.toString() !== sessionId,
      );

      if (activeSessions.length === 0) {
        user.isLoggedIn = false;
        await this.userService.saveUser(user);
      }

      return { message: 'Successfully logged out' };
    } catch (error) {
      throw new BadRequestException('Logout failed');
    }
  }
}
