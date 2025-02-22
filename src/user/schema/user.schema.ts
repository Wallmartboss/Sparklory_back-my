import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Session } from 'src/session/schema/session.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from 'src/common/enum';
import { Device } from 'src/device/schema/device.schema';

@Schema({ collection: 'user' })
export class User extends Document {
  @Prop({ unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  password: string;

  @Prop({ type: String, enum: Role, default: Role.User })
  role: Role;

  @Prop({ default: null })
  image: string;

  @Prop({ default: false })
  isLoggedIn: boolean;

  @Prop({ default: false })
  isVerifyEmail: boolean;

  @Prop({ default: null })
  emailVerifyCode: string;

  @Prop({ default: null })
  verifyDeviceCode: string;

  @Prop({ default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ default: () => new Date().toISOString() })
  updatedAt: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
    default: [],
  })
  sessions: Session[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    default: [],
  })
  devices: Device[];

  constructor(payload?: CreateUserDto) {
    super();
    if (!payload) return;
    this.email = payload.email;
    this.name = payload.email
      .split('@')[0]
      .replace(/^\w/, (c) => c.toUpperCase());
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      const DeviceModel = this.model('Device');
      await DeviceModel.deleteMany({ user: this._id });
      next();
    } catch (error) {
      next(error);
    }
  },
);

UserSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      const SessionModel = this.model('Session');
      await SessionModel.deleteMany({ user: this._id });
      next();
    } catch (error) {
      next(error);
    }
  },
);

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.devices;
    delete ret.sessions;
    delete ret.emailVerifyCode;

    delete ret.__v;
    ret._id = ret._id.toString();
    return ret;
  },
});

UserSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.devices;
    delete ret.sessions;
    delete ret.emailVerifyCode;

    delete ret.__v;
    ret._id = ret._id.toString();
    return ret;
  },
});
