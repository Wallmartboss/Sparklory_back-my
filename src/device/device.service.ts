import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device } from './schema/device.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: Model<Device>,
  ) {}
  async create(userId: Types.ObjectId) {
    const newDevice = new this.deviceModel({
      deviceId: uuidv4(),
      user: userId,
    });
    return await newDevice.save();
  }
}
