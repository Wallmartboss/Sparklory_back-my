import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyAccount, LoyaltyAccountSchema } from './loyalty-account.schema';
import { LoyaltyLevel, LoyaltyLevelSchema } from './loyalty-level.schema';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import {
  PurchaseHistory,
  PurchaseHistorySchema,
} from './purchase-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoyaltyAccount.name, schema: LoyaltyAccountSchema },
      { name: LoyaltyLevel.name, schema: LoyaltyLevelSchema },
      { name: PurchaseHistory.name, schema: PurchaseHistorySchema },
    ]),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
