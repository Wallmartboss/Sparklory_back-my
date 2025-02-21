import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { Device, DeviceSchema } from './schema/device.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
  ],
  controllers: [],
  providers: [DeviceService],
})
export class DeviceModule {}
