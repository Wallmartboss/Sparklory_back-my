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
import { randomBytes } from 'crypto';
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
    const verifyDeviceCode = randomBytes(2).toString('hex');
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
      // Создать нового пользователя
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
      // Привязать соц. ID если не был сохранён
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
}
