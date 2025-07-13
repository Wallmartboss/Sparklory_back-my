import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Model, Types } from 'mongoose';

import { InjectModel } from '@nestjs/mongoose';
import { Session } from './schema/session.schema';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
  ) {}

  async create(userId: Types.ObjectId) {
    const newSession = new this.sessionModel({
      user: userId,
    });
    return await newSession.save();
  }

  async findOneForJwt(userId: string, sessionId: string) {
    const session = await this.sessionModel
      .findOne({ _id: sessionId, user: userId, deletedAt: null })
      .populate('user')
      .exec();

    if (!session) {
      throw new BadRequestException('Session is closed!');
    }

    if (!session.user.isLoggedIn) {
      throw new UnauthorizedException();
    }

    return session;
  }
}
