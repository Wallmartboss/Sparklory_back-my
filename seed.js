"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const product_service_1 = require("./src/product/product.service");
const fs = require("fs");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const productService = app.get(product_service_1.ProductService);
    const data = JSON.parse(fs.readFileSync('products.json', 'utf8'));
    for (const item of data) {
        await productService.create(item);
    }
    console.log('✅ Дані завантажені!');
    await app.close();
}
seed().catch(err => {
    console.error('Помилка завантаження:', err);
});
//# sourceMappingURL=seed.js.map