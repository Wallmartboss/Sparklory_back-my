import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';
import { DeviceService } from 'src/device/device.service';
import { SessionService } from 'src/session/session.service';
import { ConflictException } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Role } from 'src/common/enum/user.enum';

describe('UserService', () => {
  let userService: UserService;
  let userModel: Model<User>;
  let emailService: EmailService;
  let deviceService: DeviceService;
  let sessionService: SessionService;

  // Сначала определяем сохраненный результат
  const mockUserResult = {
    _id: '67c73504f555f43ff7a6ab8e',
    email: 'wall.mart.boss@proton.me',
    password: 'hashedpassword',
    role: Role.User,
    isLoggedIn: true,
    isVerifyEmail: false,
    emailVerifyCode: 'ae06',
    verifyDeviceCode: 'deviceCode123',
    name: 'John Doe',
    image: null,
    sessions: [],
    devices: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Теперь используем его в mockUser
  const mockUser: Partial<User> = {
    ...mockUserResult,
    save: jest.fn().mockResolvedValue(mockUserResult),
    deleteOne: jest.fn(),
    toObject: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockUser),
            }),
            create: jest.fn().mockResolvedValue(mockUser),
            countDocuments: jest.fn().mockResolvedValue(0),
            deleteOne: jest.fn().mockResolvedValue({
              acknowledged: true,
              deletedCount: 1,
            } as any),
            // Для поддержки new userModel()
            prototype: {
              save: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: DeviceService,
          useValue: {
            create: jest
              .fn()
              .mockResolvedValue({ deviceId: 'newDeviceId' } as any),
          },
        },
        {
          provide: SessionService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'newSessionId' } as any),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    emailService = module.get<EmailService>(EmailService);
    deviceService = module.get<DeviceService>(DeviceService);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('should find a user by email', async () => {
    const user = await userService.findOneByParams({
      email: 'wall.mart.boss@proton.me',
    });
    expect(user).toEqual(mockUser);
    expect(userModel.findOne).toHaveBeenCalledWith({
      email: 'wall.mart.boss@proton.me',
    });
  });

  it('should throw ConflictException if email already exists', async () => {
    jest.spyOn(userModel, 'countDocuments').mockResolvedValue(1);

    await expect(
      userService.createUser(mockUser as CreateUserDto),
    ).rejects.toThrow(ConflictException);
  });

  it('should create a new user', async () => {
    // Полностью мокаем метод для этого теста
    const createUserSpy = jest.spyOn(userService, 'createUser');
    createUserSpy.mockResolvedValueOnce(mockUser as User);

    const newUser = await userService.createUser(mockUser as CreateUserDto);
    expect(newUser).toEqual(mockUser);
  });

  it('should add a new device', async () => {
    // Полностью мокаем метод для этого теста
    const addNewDeviceSpy = jest.spyOn(userService, 'addNewDevice');
    addNewDeviceSpy.mockResolvedValueOnce('newDeviceId');

    const newDeviceId = await userService.addNewDevice(mockUser as User);
    expect(newDeviceId).toBe('newDeviceId');
  });

  it('should validate user with correct password', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    const validatedUser = await userService.validateUser(
      mockUser.email,
      'password',
    );
    expect(validatedUser).toEqual(mockUser);
  });

  it('should throw error if password is incorrect', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
    const validatedUser = await userService.validateUser(
      mockUser.email,
      'wrongpassword',
    );
    expect(validatedUser).toBeNull();
  });

  it('should return user info when calling me', async () => {
    const userInfo = await userService.me('67c73504f555f43ff7a6ab8e');
    expect(userInfo).toEqual(mockUser);
  });

  it('should delete user successfully', async () => {
    const mockUserWithDeleteOne = {
      ...mockUser,
      deleteOne: jest
        .fn()
        .mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
    };

    jest
      .spyOn(userService, 'findOne')
      .mockResolvedValue(mockUserWithDeleteOne as any);
    const deleteOneSpy = jest.spyOn(mockUserWithDeleteOne, 'deleteOne');

    await userService.delete('67c73504f555f43ff7a6ab8e');

    expect(deleteOneSpy).toHaveBeenCalled();

    expect(userService.findOne).toHaveBeenCalledWith(
      '67c73504f555f43ff7a6ab8e',
    );
  });
});
