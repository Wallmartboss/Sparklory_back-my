import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from 'src/user/schema/user.schema';

@Schema({ collection: 'device', versionKey: false })
export class Device extends Document {
  @Prop({ required: true })
  deviceId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
