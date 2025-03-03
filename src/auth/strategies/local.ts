import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { UserService } from 'src/user/user.service';
import { User } from 'src/user/schema/user.schema';
import { NotFoundError } from 'rxjs';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<User> {
    try {
      const user = await this.userService.validateUser(
        email.toLowerCase(),
        password,
      );
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedException('User not found');
      }
      throw error;
    }
  }
}
