import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    me: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /user/me', () => {
    it('should return user profile data', async () => {
      const mockUser = {
        _id: '67c73504f555f43ff7a6ab8e',
        email: 'wall.mart.boss@proton.me',
        name: 'Wall Mart Boss',
        role: 'user',
        isLoggedIn: true,
        isVerifyEmail: false,
        createdAt: '2025-03-04T17:14:44.832Z',
        updatedAt: '2025-03-04T17:14:44.833Z',
      };

      mockUserService.me.mockResolvedValue(mockUser);

      const result = await controller.me('67c73504f555f43ff7a6ab8e');

      expect(result).toEqual(mockUser);
      expect(mockUserService.me).toHaveBeenCalledWith(
        '67c73504f555f43ff7a6ab8e',
      );
    });

    it('should handle errors when fetching user profile', async () => {
      const errorMessage = 'User not found';
      mockUserService.me.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.me('67c73504f555f43ff7a6ab8e'),
      ).rejects.toThrowError(errorMessage);
    });
  });
});
