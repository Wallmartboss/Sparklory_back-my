import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: LoyaltyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        {
          provide: LoyaltyService,
          useValue: {
            addPurchase: jest.fn(),
            getHistory: jest.fn(),
            getBonusBalance: jest.fn(),
            addCard: jest.fn(),
            createLevel: jest.fn(),
            updateLevel: jest.fn(),
            getLevels: jest.fn(),
            assignLevel: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();
    controller = module.get<LoyaltyController>(LoyaltyController);
    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('має бути визначений', () => {
    expect(controller).toBeDefined();
  });

  it('addPurchase викликає service.addPurchase', async () => {
    await controller.addPurchase('userId', {
      amount: 100,
      description: 'desc',
    });
    expect(service.addPurchase).toHaveBeenCalledWith('userId', 100, 'desc');
  });

  it('getHistory викликає service.getHistory', async () => {
    await controller.getHistory('userId');
    expect(service.getHistory).toHaveBeenCalledWith('userId');
  });

  it('getBonus викликає service.getBonusBalance', async () => {
    await controller.getBonus('userId');
    expect(service.getBonusBalance).toHaveBeenCalledWith('userId');
  });

  it('addCard викликає service.addCard', async () => {
    await controller.addCard('userId', { cardNumber: '123' });
    expect(service.addCard).toHaveBeenCalledWith('userId', '123');
  });

  it('createLevel викликає service.createLevel', async () => {
    await controller.createLevel({ name: 'Gold', bonusPercent: 10 });
    expect(service.createLevel).toHaveBeenCalledWith('Gold', 10);
  });

  it('updateLevel викликає service.updateLevel', async () => {
    await controller.updateLevel('levelId', 15);
    expect(service.updateLevel).toHaveBeenCalledWith('levelId', 15);
  });

  it('getLevels викликає service.getLevels', async () => {
    await controller.getLevels();
    expect(service.getLevels).toHaveBeenCalled();
  });

  it('assignLevel викликає service.assignLevel', async () => {
    await controller.assignLevel('userId', 'levelId');
    expect(service.assignLevel).toHaveBeenCalledWith('userId', 'levelId');
  });
});
