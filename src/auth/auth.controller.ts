import {
  Controller,
  Post,
  Body,
  Patch,
  Res,
  Request,
  BadRequestException,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request as req, Response } from 'express';

import { ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';
import { VerifyEmailDto } from 'src/user/dto/verify-email.dto';
import { cookieSetter } from 'src/common/helpers';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local.guard';
import { UserDecorator } from 'src/common/decorators/user.decorator';

import * as response from '../response.json';
import { ApiCustomResponse } from 'src/common/decorators/swagger-res.decorator';

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
  @ApiCustomResponse(HttpStatus.CREATED, response.register)
  async create(@Body() payload: CreateUserDto): Promise<User> {
    return await this.userService.createUser(payload);
  }

  @Patch('verify-email')
  @ApiOperation({
    summary: 'email verification',
  })
  @ApiCustomResponse(HttpStatus.OK, response.verifyEmail)
  async verifyEmail(
    @Res({ passthrough: true }) response: Response,
    @Body() payload: VerifyEmailDto,
  ) {
    const { accessToken, refreshToken, deviceId } =
      await this.authService.verifyUserEmail(payload);
    cookieSetter(response, refreshToken, deviceId);
    return { accessToken };
  }

  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'user login',
  })
  @ApiCustomResponse(HttpStatus.OK, response.login)
  @Post('login')
  async login(
    @UserDecorator() user: User,
    @Res({ passthrough: true }) response: Response,
    @Request() request: req,
    @Body() payload: LoginDto,
  ) {
    const cookiesString = request.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookiesString.split('; ').map((cookie) => cookie.split('=')),
    );
    const existingDeviceId = cookies['device_id'];

    if (!existingDeviceId) {
      const newDeviceId = await this.authService.createNewDevice(user);
      cookieSetter(response, null, newDeviceId);
      throw new BadRequestException(
        'Device not found or invalid login attempt. Please check your email',
      );
    }

    const { loggedInUser, accessToken, refreshToken } =
      await this.authService.login(
        user,
        existingDeviceId,
        payload.newDeviceCode,
      );

    cookieSetter(response, refreshToken, existingDeviceId);

    return { loggedInUser, accessToken };
  }
}
