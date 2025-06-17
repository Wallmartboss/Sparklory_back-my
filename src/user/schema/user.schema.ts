import { Role } from '@/common/enum/user.enum';
import { Device } from '@/device/schema/device.schema';
import { Session } from '@/session/schema/session.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'user', versionKey: false })
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
    type: [{ type: Types.ObjectId, ref: 'Session' }],
    default: [],
  })
  sessions: Session[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Device' }],
    default: [],
  })
  devices: Device[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add pre-save middleware to set name from email if not provided
UserSchema.pre('save', function (next) {
  if (!this.name && this.email) {
    this.name = this.email.split('@')[0].replace(/^\w/, c => c.toUpperCase());
  }
  next();
});

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
