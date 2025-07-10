import { Role } from '@/common/enum/user.enum';
import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  password: string;
  role: Role;
  image: string | null;
  isLoggedIn: boolean;
  isVerifyEmail: boolean;
  emailVerifyCode: string | null;
  verifyDeviceCode: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: Types.ObjectId[];
  devices: Types.ObjectId[];
  wishlist: Types.ObjectId[];
}
