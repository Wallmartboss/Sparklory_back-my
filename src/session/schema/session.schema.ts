import { User } from '@/user/schema/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'session', versionKey: false })
export class Session extends Document {
  @Prop({ required: true, default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ type: String, default: null })
  deletedAt?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
