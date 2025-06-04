import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { UserDecorator } from '@/common/decorators/user.decorator';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'view your own profile',
  })
  @Get('me')
  async me(@UserDecorator('sub') sub: string) {
    return this.userService.me(sub);
  }
}
