import { DeviceService } from '@/device/device.service';
import { Device, DeviceSchema } from '@/device/schema/device.schema';
import { EmailService } from '@/email/email.service';
import { Session, SessionSchema } from '@/session/schema/session.schema';
import { SessionService } from '@/session/session.service';
import { User, UserSchema } from '@/user/schema/user.schema';
import { UserService } from '@/user/user.service';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies';
import { JwtStrategy } from './strategies/jwt';
import {
  LoyaltyAccount,
  LoyaltyAccountSchema,
} from '../loyalty/loyalty-account.schema';
import {
  LoyaltyLevel,
  LoyaltyLevelSchema,
} from '../loyalty/loyalty-level.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Session.name, schema: SessionSchema },
      { name: LoyaltyAccount.name, schema: LoyaltyAccountSchema },
      { name: LoyaltyLevel.name, schema: LoyaltyLevelSchema },
    ]),
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    EmailService,
    DeviceService,
    SessionService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
