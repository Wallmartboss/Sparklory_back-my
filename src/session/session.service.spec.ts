import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SessionService } from './session.service';
import { Session } from './schema/session.schema';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('SessionService', () => {
  let service: SessionService;

  const mockSessionDocument = {
    _id: new Types.ObjectId('67c8b17917f0c142eeb8987c'),
    createdAt: '2025-03-05T20:18:01.964Z',
    user: new Types.ObjectId('67c73504f555f43ff7a6ab8e'),
    save: jest.fn().mockResolvedValue({
      _id: new Types.ObjectId('67c8b17917f0c142eeb8987c'),
      createdAt: '2025-03-05T20:18:01.964Z',
      user: new Types.ObjectId('67c73504f555f43ff7a6ab8e'),
    }),
  };

  const mockSessionModel = {
    new: jest.fn().mockImplementation(data => ({
      ...mockSessionDocument,
      ...data,
    })),
    findOne: jest.fn().mockImplementation(() => ({
      populate: jest.fn().mockImplementation(() => ({
        exec: jest.fn(),
      })),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a session', async () => {
    const userId = new Types.ObjectId('67c73504f555f43ff7a6ab8e');

    const mockCreateSession = jest.fn().mockResolvedValue({
      _id: new Types.ObjectId('67c8b17917f0c142eeb8987c'),
      createdAt: '2025-03-05T20:18:01.964Z',
      user: userId,
    });

    jest.spyOn(service, 'create').mockImplementation(mockCreateSession);

    const result = await service.create(userId);

    expect(result._id).toBeDefined();
    expect(result.user).toEqual(userId);
  });

  it('should find one session for JWT', async () => {
    const userId = '67c73504f555f43ff7a6ab8e';
    const sessionId = '67c8b17917f0c142eeb8987c';

    const sessionData = {
      _id: new Types.ObjectId(sessionId),
      user: {
        _id: new Types.ObjectId(userId),
        isLoggedIn: true,
      },
    };

    jest.spyOn(mockSessionModel, 'findOne').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(sessionData),
      }),
    });

    const result = await service.findOneForJwt(userId, sessionId);

    expect(result).toEqual(sessionData);
  });

  it('should throw BadRequestException if session is not found', async () => {
    const userId = '67c73504f555f43ff7a6ab8e';
    const sessionId = '67c8b17917f0c142eeb8987c';

    jest.spyOn(mockSessionModel, 'findOne').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.findOneForJwt(userId, sessionId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw UnauthorizedException if user is not logged in', async () => {
    const userId = '67c73504f555f43ff7a6ab8e';
    const sessionId = '67c8b17917f0c142eeb8987c';

    const sessionData = {
      _id: new Types.ObjectId(sessionId),
      user: {
        _id: new Types.ObjectId(userId),
        isLoggedIn: false,
      },
    };

    jest.spyOn(mockSessionModel, 'findOne').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(sessionData),
      }),
    });

    await expect(service.findOneForJwt(userId, sessionId)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
