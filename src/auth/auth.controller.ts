import { Controller, Post, Body, Patch, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request as req, Response } from 'express';

import { ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';
import { VerifyEmailDto } from 'src/user/dto/verify-email.dto';
import { cookieSetter } from 'src/common/helpers';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'create new user',
  })
  // @ApiCustomResponse(HttpStatus.CREATED, responses.register)
  async create(@Body() payload: CreateUserDto): Promise<User> {
    return await this.userService.createUser(payload);
  }

  @Patch('verify-email')
  @ApiOperation({
    summary: 'email verification',
  })
  // @ApiCustomResponse(HttpStatus.OK, responses.verifyEmail)
  async verifyEmail(
    @Res({ passthrough: true }) response: Response,
    @Body() payload: VerifyEmailDto,
  ) {
    const { accessToken, refreshToken, deviceId } =
      await this.authService.verifyUserEmail(payload);
    cookieSetter(response, refreshToken, deviceId);
    return { accessToken };
  }
}
