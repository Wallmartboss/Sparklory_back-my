import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InTokensGenerate } from 'src/common';
import { VerifyEmailDto } from 'src/user/dto/verify-email.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    readonly jwtService: JwtService,
    private configService: ConfigService,
    readonly userService: UserService,
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
}
