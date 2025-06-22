import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { EmailService } from '../email/email.service';
import { UserModule } from '../user/user.module';
import { PaymentController } from './payment.controller';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    CartModule,
    UserModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, EmailService],
  exports: [PaymentService],
})
export class PaymentModule {}
