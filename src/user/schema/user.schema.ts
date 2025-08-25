import { Role } from '@/common/enum/user.enum';
import { Device } from '@/device/schema/device.schema';
import { Session } from '@/session/schema/session.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'user', versionKey: false })
export class User extends Document {
  /**
   * User full name
   */
  @ApiProperty({ example: 'Vasyl Bordanov' })
  @Prop({ required: true })
  name: string;
  /**
   * User email address
   */
  @ApiProperty({ example: 'example@gmail.com' })
  @Prop({ unique: true })
  email: string;

  /**
   * User password (hashed)
   */
  @ApiProperty({
    example: 'hashedPassword',
    description: 'Hashed user password',
  })
  @Prop()
  password: string;

  /**
   * User role
   */
  @ApiProperty({ example: 'user', enum: Role, default: Role.User })
  @Prop({ type: String, enum: Role, default: Role.User })
  role: Role;

  /**
   * User profile image URL
   */
  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @Prop({ default: null })
  image: string;

  /**
   * Is user logged in
   */
  @ApiProperty({ example: false })
  @Prop({ default: false })
  isLoggedIn: boolean;

  /**
   * Is user email verified
   */
  @ApiProperty({ example: false })
  @Prop({ default: false })
  isVerifyEmail: boolean;

  /**
   * Email verification code
   */
  @ApiProperty({ example: '1234', required: false })
  @Prop({ default: null })
  emailVerifyCode: string;

  /**
   * Device verification code
   */
  @ApiProperty({ example: '5678', required: false })
  @Prop({ default: null })
  verifyDeviceCode: string;

  /**
   * User creation date
   */
  @ApiProperty({ example: '2024-05-01T12:00:00.000Z' })
  @Prop({ default: () => new Date().toISOString() })
  createdAt: string;

  /**
   * User update date
   */
  @ApiProperty({ example: '2024-05-01T12:00:00.000Z' })
  @Prop({ default: () => new Date().toISOString() })
  updatedAt: string;

  /**
   * User sessions
   */
  @ApiProperty({ type: [Session], required: false })
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Session' }],
    default: [],
  })
  sessions: Session[];

  /**
   * User devices
   */
  @ApiProperty({ type: [Device], required: false })
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Device' }],
    default: [],
  })
  devices: Device[];

  /**
   * Wishlist - array of product IDs liked by the user
   */
  @ApiProperty({
    example: ['60d21b4667d0d8992e610c85', '60d21b4967d0d8992e610c86'],
    description: 'Array of product IDs liked by the user',
    type: [String],
    required: false,
  })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist: Types.ObjectId[];

  /**
   * Facebook ID (social login)
   */
  @ApiProperty({ example: '1234567890', required: false })
  @Prop({ default: null, unique: true })
  facebookId?: string;

  /**
   * Google ID (social login)
   */
  @ApiProperty({ example: 'abcdefg123456', required: false })
  @Prop({ default: null, unique: true })
  googleId?: string;

  /**
   * Код для сброса пароля (если был запрошен)
   */
  @ApiProperty({ example: '123456', required: false })
  @Prop({ default: null })
  resetPasswordCode?: string;
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
