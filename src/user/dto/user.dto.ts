import { Role } from '@/common/enum/user.enum';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class UserDTO {
  @Expose()
  @Transform(({ value }) => value?.toString())
  _id: Types.ObjectId;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ value }) => value?.toString())
  password: string;

  @Expose()
  role: Role;

  @Expose()
  image: string;

  @Expose()
  isLoggedIn: boolean;

  @Expose()
  isVerifyEmail: boolean;

  @Expose()
  emailVerifyCode: string;

  @Expose()
  verifyDeviceCode: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  @Transform(({ value }) => value?.map(id => id.toString()))
  sessions: Types.ObjectId[];

  @Expose()
  @Transform(({ value }) => value?.map(id => id.toString()))
  devices: Types.ObjectId[];

  @Expose()
  @Transform(({ value }) => value?.map(id => id.toString()))
  wishlist: Types.ObjectId[];

  constructor(partial: Partial<UserDTO>) {
    Object.assign(this, partial);
  }
}
