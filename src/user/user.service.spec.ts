import { DeviceService } from '@/device/device.service';
import { EmailService } from '@/email/email.service';
import { SessionService } from '@/session/session.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  ...jest.requireActual('bcrypt'),
  hash: jest.fn(),
  compare: jest.fn(),
}));

class MockUserModel {
  save = jest.fn();
  _id: Types.ObjectId = new Types.ObjectId();
  id: string = this._id.toString();
  emailVerifyCode: string;
  isVerifyEmail: boolean = false;
  isLoggedIn: boolean = false;
  password: string;
  role: string = 'user';
  name?: string;
  email: string;
  devices: any[] = []; // Инициализированы по умолчанию
  sessions: any[] = []; // Инициализированы по умолчанию

  constructor(data: any) {
    Object.assign(this, data);
    this.save.mockResolvedValue(this);
    this.password = data.password || '';
    this.emailVerifyCode = data.emailVerifyCode || '';
    this.email = data.email || '';
    // Убеждаемся, что массивы всегда определены
    this.devices = data.devices || [];
    this.sessions = data.sessions || [];
  }

  static findOne = jest.fn();
  static countDocuments = jest.fn();
  static deleteOne = jest.fn().mockResolvedValue({});
  static updateOne = jest.fn().mockResolvedValue({});

  deleteOne = jest.fn().mockResolvedValue({});
}

describe('UserService', () => {
  let service: UserService;
  let emailService: EmailService;
  let deviceService: DeviceService;
  let sessionService: SessionService;

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockDeviceService = {
    create: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest
      .spyOn(crypto, 'randomBytes')
      .mockImplementation(() => Buffer.from([0x12, 0x34]));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: EmailService, useValue: mockEmailService },
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: 'UserModel', useValue: MockUserModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    emailService = module.get<EmailService>(EmailService);
    deviceService = module.get<DeviceService>(DeviceService);
    sessionService = module.get<SessionService>(SessionService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyUserEmail', () => {
    it('should verify email successfully', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@example.com',
        code: '1234',
      };

      const mockUser = new MockUserModel({
        email: 'test@example.com',
        emailVerifyCode: '1234',
        isVerifyEmail: false,
        isLoggedIn: false,
        _id: new Types.ObjectId(),
        devices: [], // Явно передаем пустые массивы
        sessions: [],
      });

      jest.spyOn(MockUserModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const deviceId = new Types.ObjectId().toString();
      const sessionId = new Types.ObjectId().toString();

      mockDeviceService.create.mockResolvedValue({ deviceId });
      mockSessionService.create.mockResolvedValue({ id: sessionId });

      const result = await service.verifyUserEmail(verifyEmailDto);

      expect(result).toEqual({
        email: 'test@example.com',
        role: 'user',
        id: mockUser.id,
        deviceId,
        sessionId,
      });
      expect(mockUser.isVerifyEmail).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.devices.length).toBe(1);
      expect(mockUser.sessions.length).toBe(1);
    });

    it('should throw BadRequestException if the email or code is incorrect', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@example.com',
        code: 'incorrect',
      };

      jest.spyOn(MockUserModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.verifyUserEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if the email verification code does not match', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@example.com',
        code: 'wrongcode',
      };

      const mockUser = new MockUserModel({
        email: 'test@example.com',
        emailVerifyCode: '1234',
        isVerifyEmail: false,
        isLoggedIn: false,
        _id: new Types.ObjectId(),
        devices: [],
        sessions: [],
      });

      jest.spyOn(MockUserModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      await expect(service.verifyUserEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Vasyl Bordanov',
      };

      const mockUser = new MockUserModel({
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerifyCode: '1234',
        isVerifyEmail: false,
        isLoggedIn: false,
        role: 'user',
        name: 'Vasyl Bordanov',
        devices: [],
        sessions: [],
      });

      MockUserModel.countDocuments.mockResolvedValue(0);
      mockEmailService.sendEmail.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(MockUserModel.prototype, 'save').mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toMatchObject({
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
        isVerifyEmail: false,
        isLoggedIn: false,
      });
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'password123',
        expect.any(Number),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Vasyl Bordanov',
      };

      MockUserModel.countDocuments.mockResolvedValue(1);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return a user if the email and password match', async () => {
      const user = new MockUserModel({
        email: 'test@example.com',
        password: 'hashedPassword123',
        devices: [],
        sessions: [],
      });

      jest.spyOn(MockUserModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(user);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123',
      );
    });

    it('should return null if the password is incorrect', async () => {
      const user = new MockUserModel({
        email: 'test@example.com',
        password: 'hashedPassword123',
        devices: [],
        sessions: [],
      });

      jest.spyOn(MockUserModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });

    it('should throw NotFoundException if the user is not found', async () => {
      jest.spyOn(MockUserModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.validateUser('notfound@example.com', 'pass'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
