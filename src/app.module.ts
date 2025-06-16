import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DeviceModule } from './device/device.module';
import { SessionModule } from './session/session.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppLoggerMiddleware } from './common/loggers/app-logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('DB_CONNECTION_STRING');
        if (!uri) {
          throw new Error('❌ DB_CONNECTION_STRING is not defined in .env');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    UserModule,
    DeviceModule,
    SessionModule,
    AuthModule,
    ProductModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
