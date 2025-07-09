import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

import { ApiCustomResponse } from '@/common/decorators/swagger-res.decorator';
import { ECondition } from '@/common/enum/email.enum';
import { EmailService } from '@/email/email.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { VerifyEmailDto } from '@/user/dto/verify-email.dto';
import { User } from '@/user/schema/user.schema';
import { UserService } from '@/user/user.service';
import { randomBytes } from 'crypto';
import * as response from '../response.json';
import { LoginDTO } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local.guard';

class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email користувача',
  })
  email: string;
}

class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email користувача',
  })
  email: string;

  @ApiProperty({ example: 'a1b2c3', description: 'Код з листа' })
  code: string;

  @ApiProperty({ example: 'newStrongPassword123', description: 'Новий пароль' })
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
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

  @Get('facebook')
  @ApiOperation({ summary: 'Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook login' })
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin() {
    // Guard handles redirect
  }

  @Get('facebook/redirect')
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 200, description: 'Returns JWT tokens and user info' })
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginCallback(@Req() req: Request, @Res() res: Response) {
    // req.user містить користувача
    // Повернути JWT токени та користувача
    const result = await this.authService.login(req.user as any);
    return res.json({
      user: result.loggedInUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Guard handles redirect
  }

  @Get('google/redirect')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Returns JWT tokens and user info' })
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.login(req.user as any);
    return res.json({
      user: result.loggedInUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset (send code to email)' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent to email',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const { email } = dto;
    const user = await this.userService.findByEmail(email);
    if (!user)
      throw new BadRequestException('Користувача з таким email не знайдено');
    const code = randomBytes(3).toString('hex');
    user.resetPasswordCode = code;
    await this.userService.saveUser(user);
    await this.emailService.sendEmail(email, code, ECondition.ResetPassword);
    return { message: 'Код для скидання пароля надіслано на email' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using code from email' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    const { email, code, newPassword } = body;
    const user = await this.userService.findByEmail(email);
    if (!user || user.resetPasswordCode !== code) {
      throw new BadRequestException('Невірний email або код');
    }
    user.password = newPassword;
    user.resetPasswordCode = null;
    await this.userService.saveUser(user);
    return { message: 'Пароль успішно скинуто' };
  }
}
