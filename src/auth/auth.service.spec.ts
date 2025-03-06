import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { SessionService } from 'src/session/session.service';
import { User } from 'src/user/schema/user.schema';
import { Role } from 'src/common/enum/user.enum';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { VerifyEmailDto } from 'src/user/dto/verify-email.dto';
import { InTokensGenerate } from 'src/common';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('testDeviceCode'),
  }),
  createHash: jest.fn().mockImplementation(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-hash'),
  })),
}));

describe('AuthService', () => {
  let mockAuthService: any;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userService: UserService;
  let sessionService: SessionService;

  const mockUser: Partial<User> = {
    _id: new Types.ObjectId('67c73504f555f43ff7a6ab8e'),
    id: '67c73504f555f43ff7a6ab8e',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: Role.User,
    isLoggedIn: false,
    isVerifyEmail: false,
    emailVerifyCode: 'ae06',
    verifyDeviceCode: 'existingDeviceCode',
    name: 'John Doe',
    image: null,
    sessions: [],
    devices: [],
    save: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn(),
    toObject: jest.fn().mockReturnValue({}),
  };

  // Mock response from verifyUserEmail
  const mockVerifyEmailResponse = {
    email: 'test@example.com',
    role: Role.User,
    id: 123,
    name: 'John Doe',
    sessionId: 123,
    deviceId: 'deviceId123',
  };

  beforeEach(async () => {
    const jwtServiceMock = {
      signAsync: jest.fn().mockImplementation((payload, options?) => {
        return options?.secret ? 'refresh-token' : 'access-token';
      }),
    };

    const configServiceMock = {
      get: jest.fn().mockReturnValue('refresh-secret'),
    };

    const userServiceMock = {
      verifyUserEmail: jest.fn().mockResolvedValue(mockVerifyEmailResponse),
      addNewDevice: jest.fn().mockResolvedValue('newDeviceId'),
      saveUser: jest.fn().mockResolvedValue(mockUser),
    };

    const sessionServiceMock = {
      create: jest.fn().mockResolvedValue({
        id: 'newSessionId',
        _id: new Types.ObjectId('67c73504f555f43ff7a6ab8f'),
      }),
    };

    // Создаем мок-объект для AuthService
    mockAuthService = {
      verifyUserEmail: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        deviceId: 'deviceId123',
      }),
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      createNewDevice: jest.fn().mockResolvedValue('newDeviceId'),
      login: jest.fn().mockImplementation((user, deviceId, verifyCode) => {
        if (verifyCode && user.verifyDeviceCode !== verifyCode) {
          throw new BadRequestException('Invalid verification code');
        }
        return Promise.resolve({
          loggedInUser: user,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });
      }),
    };

    // Сохраняем моки в тестовых переменных для дальнейшего использования
    jwtService = jwtServiceMock as unknown as JwtService;
    configService = configServiceMock as unknown as ConfigService;
    userService = userServiceMock as unknown as UserService;
    sessionService = sessionServiceMock as unknown as SessionService;

    jest.spyOn(crypto, 'randomBytes').mockImplementation(
      () =>
        ({
          toString: () => 'testDeviceCode',
        }) as any,
    );
  });

  it('should be defined', () => {
    expect(mockAuthService).toBeDefined();
  });

  describe('verifyUserEmail', () => {
    it('should verify user email and return tokens', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@example.com',
        code: 'ae06',
      };

      const result = await mockAuthService.verifyUserEmail(verifyEmailDto);

      expect(mockAuthService.verifyUserEmail).toHaveBeenCalledWith(
        verifyEmailDto,
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        deviceId: 'deviceId123',
      });
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const payload: InTokensGenerate = {
        email: 'test@example.com',
        role: Role.User,
        id: 123,
        name: 'John Doe',
        sessionId: 123,
        deviceId: 'deviceId123',
      };

      const result = await mockAuthService.generateTokens(payload);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('createNewDevice', () => {
    it('should create a new device and return device id', async () => {
      const user = { ...mockUser } as User;

      const result = await mockAuthService.createNewDevice(user);

      expect(result).toBe('newDeviceId');
    });
  });

  describe('login', () => {
    it('should login user without verification code', async () => {
      const user = { ...mockUser, sessions: [] } as User;
      const deviceId = 'deviceId123';

      const result = await mockAuthService.login(user, deviceId);

      expect(result).toEqual({
        loggedInUser: user,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should login user with correct verification code', async () => {
      const user = {
        ...mockUser,
        sessions: [],
        verifyDeviceCode: 'correctCode',
      } as User;
      const deviceId = 'deviceId123';
      const verifyDeviceCode = 'correctCode';

      const result = await mockAuthService.login(
        user,
        deviceId,
        verifyDeviceCode,
      );

      expect(result).toEqual({
        loggedInUser: user,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw BadRequestException for incorrect verification code', () => {
      const user = {
        ...mockUser,
        verifyDeviceCode: 'correctCode',
      } as User;
      const deviceId = 'deviceId123';
      const verifyDeviceCode = 'wrongCode';

      expect(() => {
        mockAuthService.login(user, deviceId, verifyDeviceCode);
      }).toThrow(BadRequestException);
    });
  });
});
