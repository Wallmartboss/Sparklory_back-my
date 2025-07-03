import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { AppLoggerMiddleware } from './common/loggers/app-logger';
import { CoreModule } from './core/core.module';
import { CouponModule } from './coupon/coupon.module';
import { DeviceModule } from './device/device.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { PaymentModule } from './payment/payment.module';
import { ProductModule } from './product/product.module';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      // imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('DB_CONNECTION_STRING');
        if (!uri) {
          throw new Error('❌ DB_CONNECTION_STRING is not defined in .env');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    CoreModule,
    UserModule,
    DeviceModule,
    SessionModule,
    AuthModule,
    ProductModule,
    CartModule,
    PaymentModule,
    ScheduleModule.forRoot(),
    LoyaltyModule,
    CouponModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
