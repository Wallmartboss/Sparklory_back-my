import { DeviceService } from '@/device/device.service';
import { Device, DeviceSchema } from '@/device/schema/device.schema';
import { EmailService } from '@/email/email.service';
import { Session, SessionSchema } from '@/session/schema/session.schema';
import { SessionService } from '@/session/session.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, DeviceService, SessionService],
})
export class UserModule {}
