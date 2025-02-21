import { Injectable } from '@nestjs/common';

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
}
