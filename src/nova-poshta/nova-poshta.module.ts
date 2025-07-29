import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppCacheModule } from '../cache/cache.module';
import { NovaPoshtaController } from './nova-poshta.controller';
import { NovaPoshtaService } from './nova-poshta.service';

@Module({
  imports: [
    HttpModule,
    AppCacheModule, // используем in-memory кэш для ускорения API
  ],
  providers: [NovaPoshtaService],
  controllers: [NovaPoshtaController],
  exports: [NovaPoshtaService],
})
export class NovaPoshtaModule {}
