import { User } from '@/user/schema/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'device', versionKey: false })
export class Device extends Document {
  @Prop({ required: true })
  deviceId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
