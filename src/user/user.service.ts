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

  async verifyUserEmail(payload: VerifyEmailDto) {
    const { email, code } = payload;

    // Знаходимо користувача за email та кодом підтвердження
    const user = await this.userModel.findOne({ email, emailVerifyCode: code });

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    // // Оновлюємо користувача
    user.isVerifyEmail = true;
    user.isLoggedIn = true;
    user.emailVerifyCode = null;

    const [newDevice, newSession] = await Promise.all([
      this.deviceService.create(user._id as Types.ObjectId),
      this.sessionService.create(user._id as Types.ObjectId),
    ]);

    user.devices.push(newDevice);
    user.sessions.push(newSession);

    // Додаємо пристрій та сесію до користувача
    // user.devices.push(savedDevice);
    // user.sessions.push(createdSession);

    // Оновлюємо користувача в базі даних
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
