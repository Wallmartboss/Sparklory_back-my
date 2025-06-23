import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiCustomResponse } from '@/common/decorators/swagger-res.decorator';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { VerifyEmailDto } from '@/user/dto/verify-email.dto';
import { User } from '@/user/schema/user.schema';
import { UserService } from '@/user/user.service';
import { ApiOperation } from '@nestjs/swagger';
import * as response from '../response.json';
import { LoginDTO } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local.guard';

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
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.userService.createUser(createUserDto);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'email verification',
  })
  @ApiCustomResponse(HttpStatus.OK, response.verifyEmail)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const result = await this.authService.verifyUserEmail(verifyEmailDto);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      deviceId: result.deviceId,
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'email verification by link' })
  @ApiCustomResponse(HttpStatus.OK, response.verifyEmail)
  async verifyEmailByLink(
    @Query('email') email: string,
    @Query('code') code: string,
  ) {
    const result = await this.authService.verifyUserEmail({ email, code });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      deviceId: result.deviceId,
    };
  }

  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'user login',
  })
  @ApiCustomResponse(HttpStatus.OK, response.login)
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    const { email, password } = loginDto;
    const user = await this.authService.userService.validateUser(
      email,
      password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(user);
    return {
      user: result.loggedInUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
