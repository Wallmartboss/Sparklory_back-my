import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { SessionService } from 'src/session/session.service';
import { Request } from 'express';
import { getDeviceIdFromCookies, JwtPayload } from 'src/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly sessionService: SessionService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (!payload) {
      throw new UnauthorizedException();
    }
    const deviceId = getDeviceIdFromCookies(req.headers.cookie);

    if (deviceId !== payload.deviceId) {
      throw new UnauthorizedException();
    }

    const { sub, sessionId } = payload;
    await this.sessionService.findOneForJwt(sub, sessionId);
    return { ...payload, id: sub };
  }
}
