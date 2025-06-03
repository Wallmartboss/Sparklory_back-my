import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from './device.service';
import { Device } from './schema/device.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('DeviceService', () => {
  let deviceService: DeviceService;
  let deviceModel: Model<Device>;
  const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue(mockUUID);

    const mockDeviceModel = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: getModelToken(Device.name),
          useValue: mockDeviceModel,
        },
      ],
    }).compile();

    deviceService = module.get<DeviceService>(DeviceService);
    deviceModel = module.get<Model<Device>>(getModelToken(Device.name));
  });

  it('should be defined', () => {
    expect(deviceService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new device with the given userId', async () => {
      const userId = new Types.ObjectId();
      const mockDevice = {
        deviceId: mockUUID,
        user: userId,
      };

      (deviceModel.create as jest.Mock).mockResolvedValueOnce(mockDevice);

      const result = await deviceService.create(userId);

      expect(result).toEqual(mockDevice);
      expect(deviceModel.create).toHaveBeenCalledWith({
        deviceId: mockUUID,
        user: userId,
      });
    });

    it('should use uuidv4 to generate a deviceId', async () => {
      const userId = new Types.ObjectId();

      (deviceModel.create as jest.Mock).mockResolvedValueOnce({
        deviceId: mockUUID,
        user: userId,
      });

      await deviceService.create(userId);

      expect(uuidv4).toHaveBeenCalled();
    });

    it('should throw an error if saving fails', async () => {
      const userId = new Types.ObjectId();
      const errorMessage = 'Failed to save device';

      (deviceModel.create as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await expect(deviceService.create(userId)).rejects.toThrow(errorMessage);
    });
  });
});
