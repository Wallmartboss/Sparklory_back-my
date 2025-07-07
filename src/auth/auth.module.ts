import { DeviceService } from '@/device/device.service';
import { Device, DeviceSchema } from '@/device/schema/device.schema';
import { EmailService } from '@/email/email.service';
import { Session, SessionSchema } from '@/session/schema/session.schema';
import { SessionService } from '@/session/session.service';
import { User, UserSchema } from '@/user/schema/user.schema';
import { UserService } from '@/user/user.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LoyaltyAccount,
  LoyaltyAccountSchema,
} from '../loyalty/loyalty-account.schema';
import {
  LoyaltyLevel,
  LoyaltyLevelSchema,
} from '../loyalty/loyalty-level.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt';

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
    FacebookStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
