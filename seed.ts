import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProductService } from './src/product/product.service';
import * as fs from 'fs';
import { CreateProductDto } from './src/product/dto/create-product.dto';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productService = app.get(ProductService);

  const data = JSON.parse(
    fs.readFileSync('products.json', 'utf8'),
  ) as CreateProductDto[];

  for (const item of data) {
    await productService.create(item);
  }

  console.log('✅ Дані завантажені!');
  await app.close();
}

seed().catch(err => {
  console.error('Помилка завантаження:', err);
});
