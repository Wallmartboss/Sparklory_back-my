import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';

import { ECondition } from '@/common';
import { DeviceService } from '@/device/device.service';
import { Device } from '@/device/schema/device.schema';
import { EmailService } from '@/email/email.service';
import { Session } from '@/session/schema/session.schema';
import { SessionService } from '@/session/session.service';
import { LoyaltyAccount } from '../loyalty/loyalty-account.schema';
import { LoyaltyLevel } from '../loyalty/loyalty-level.schema';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
    @InjectModel(Device.name) private readonly deviceModel: Model<Device>,
    @InjectModel(LoyaltyAccount.name)
    private readonly loyaltyModel: Model<LoyaltyAccount>,
    @InjectModel(LoyaltyLevel.name)
    private readonly loyaltyLevelModel: Model<LoyaltyLevel>,
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
    console.log(token);

    await this.emailService.sendEmail(
      payload.email,
      token,
      ECondition.EmailVerify,
    );
    await newUser.save();

    // Призначати всім користувачам один і той самий рівень 'Default' (створювати тільки якщо його немає)
    let defaultLevel = await this.loyaltyLevelModel.findOne({
      name: 'Default',
    });
    if (!defaultLevel) {
      defaultLevel = await this.loyaltyLevelModel.create({
        name: 'Default',
        bonusPercent: 0,
      });
    }
    await this.loyaltyModel.create({
      userId: newUser._id,
      levelId: defaultLevel._id,
      totalAmount: 0,
      bonusBalance: 0,
    });

    return await this.findOne(newUser.id);
  }

  async saveUser(user: User): Promise<User> {
    if (user.password && !user.password.startsWith('$2b$')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    return user.save();
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
    const verifyDeviceCode = randomBytes(2).toString('hex');
    user.verifyDeviceCode = verifyDeviceCode;
    await this.saveUser(user);

    await this.emailService.sendEmail(
      user.email,
      verifyDeviceCode,
      ECondition.VerifyDevice,
    );

    return verifyDeviceCode;
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

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await user.deleteOne();
  }
}
