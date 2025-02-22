import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { InTokensGenerate } from 'src/common';
import { SessionService } from 'src/session/session.service';
import { VerifyEmailDto } from 'src/user/dto/verify-email.dto';
import { User } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    readonly jwtService: JwtService,
    private configService: ConfigService,
    readonly userService: UserService,
    readonly sessionService: SessionService,
  ) {}

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

  async login(
    user: User,
    deviceId: string | undefined,
    verifyDeviceCode?: string,
  ) {
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
}
