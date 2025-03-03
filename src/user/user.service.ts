import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';

import { User } from './schema/user.schema';
import { EmailService } from 'src/email/email.service';
import { ECondition } from 'src/common';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { DeviceService } from 'src/device/device.service';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
    readonly deviceService: DeviceService,
    readonly sessionService: SessionService,
  ) {}

  async createUser(payload: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.countDocuments({
      email: payload.email,
    });

    if (existingUser > 0) {
      throw new ConflictException('Email already exists');
    }

    const newUser = new this.userModel(payload);
    const token = randomBytes(2).toString('hex');

    newUser.password = await bcrypt.hash(payload.password, 10);
    newUser.emailVerifyCode = token;

    await this.emailService.sendEmail(
      payload.email,
      token,
      ECondition.EmailVerify,
    );
    await newUser.save();
    return await this.findOne(newUser.id);
  }

  async saveUser(user: User) {
    await user.save();
  }

  async verifyUserEmail(payload: VerifyEmailDto) {
    const { email, code } = payload;

    const user = await this.userModel.findOne({ email, emailVerifyCode: code });

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    user.isVerifyEmail = true;
    user.isLoggedIn = true;
    user.emailVerifyCode = null;

    const [newDevice, newSession] = await Promise.all([
      this.deviceService.create(user._id as Types.ObjectId),
      this.sessionService.create(user._id as Types.ObjectId),
    ]);

    user.devices.push(newDevice);
    user.sessions.push(newSession);

    await user.save();
    return {
      email: user.email,
      role: user.role,
      id: user.id,
      name: user.name,
      deviceId: newDevice.deviceId,
      sessionId: newSession.id,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findOneByParams({ email });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    if (!user?.password) {
      throw new BadRequestException('You must set a password for your account');
    }

    if (await bcrypt.compare(password, user.password)) {
      return user;
    }

    return null;
  }

  async addNewDevice(user: User) {
    const newDevice = await this.deviceService.create(
      user._id as Types.ObjectId,
    );

    user.devices.push(newDevice);
    await user.save();

    await this.emailService.sendEmail(
      user.email,
      user.verifyDeviceCode,
      ECondition.VerifyDevice,
    );

    return newDevice.id;
  }

  async me(userId: string) {
    return await this.findOneByParams({ _id: userId });
  }

  async findOneByParams(
    params: Record<string, string | number | boolean>,
  ): Promise<User | null> {
    return await this.userModel.findOne(params).exec();
  }

  async findOne(userId: string): Promise<User | null> {
    return await this.userModel.findOne({ _id: userId }).exec();
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await user.deleteOne();
  }
}
