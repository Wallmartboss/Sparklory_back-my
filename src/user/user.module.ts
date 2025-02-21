import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schema/user.schema';
import { EmailService } from 'src/email/email.service';
import { Device, DeviceSchema } from 'src/device/schema/device.schema';
import { DeviceService } from 'src/device/device.service';
import { SessionService } from 'src/session/session.service';
import { Session, SessionSchema } from 'src/session/schema/session.schema';

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
