import { DeviceService } from '@/device/device.service';
import { Device, DeviceSchema } from '@/device/schema/device.schema';
import { EmailService } from '@/email/email.service';
import { Session, SessionSchema } from '@/session/schema/session.schema';
import { SessionService } from '@/session/session.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LoyaltyAccount,
  LoyaltyAccountSchema,
} from '../loyalty/loyalty-account.schema';
import {
  LoyaltyLevel,
  LoyaltyLevelSchema,
} from '../loyalty/loyalty-level.schema';
import { ProductModule } from '../product/product.module';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Session.name, schema: SessionSchema },
      { name: LoyaltyAccount.name, schema: LoyaltyAccountSchema },
      { name: LoyaltyLevel.name, schema: LoyaltyLevelSchema },
    ]),
    ProductModule, // Import ProductModule for ProductService
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, DeviceService, SessionService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
