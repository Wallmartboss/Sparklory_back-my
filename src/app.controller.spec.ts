import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const expectedResult = 'Hello World!';
      jest.spyOn(appService, 'getHello').mockReturnValue(expectedResult);

      expect(appController.getHello()).toBe(expectedResult);
      expect(appService.getHello).toHaveBeenCalled();
    });

    it('should handle service errors', () => {
      jest.spyOn(appService, 'getHello').mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => appController.getHello()).toThrow('Service error');
    });

    it('should return different message when service returns different value', () => {
      const customMessage = 'Custom Hello!';
      jest.spyOn(appService, 'getHello').mockReturnValue(customMessage);

      expect(appController.getHello()).toBe(customMessage);
      expect(appService.getHello).toHaveBeenCalledTimes(1);
    });
  });
});
