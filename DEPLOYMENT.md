# Деплой на Render.com

## Кешування

Додаток використовує **in-memory кеш** для прискорення API Nova Poshta:

- **Не потребує зовнішніх сервісів** 
- **Працює з коробки** на будь-якій платформі
- **Прискорює API у 15 разів** (з ~5000ms до ~350ms)
- **Автоматично керується** додатком

## Налаштування Environment Variables на Render

1. Зайдіть у ваш Web Service на Render
2. Перейдіть до "Environment"
3. Додайте змінні:

```env
# Основні змінні
NODE_ENV=production
DB_CONNECTION_STRING=your_mongodb_url

# Nova Poshta API
NOVA_POSHTA_API_URL=https://api.novaposhta.ua/v2.0/json/
NOVA_POSHTA_API_KEY=your_api_key
NOVA_POSHTA_CITY_REF=your_city_ref
NOVA_POSHTA_WAREHOUSE_NAME=your_warehouse_name
```

## Перевірка роботи кешу

Після деплою перевірте логи:

```bash
# В логах Render ви побачите:
[Nest] LOG [InstanceLoader] AppCacheModule dependencies initialized
```

Кеш працюватиме автоматично - ніяких додаткових налаштувань не потрібно.

## Рекомендації за планами

### Free Tier
- **In-memory кеш** працює відмінно на безкоштовних планах
- Ніяких додаткових витрат

### Production
- **In-memory кеш** готовий до production
- Стабільна робота без зовнішніх залежностей

## Тестування

Після деплою протестуйте API:
```bash
curl "https://your-app.onrender.com/api/v1/nova-poshta/warehouses?cityRef=db5c88f5-391c-11dd-90d9-001a92567626"
```

Повторний запит має бути швидшим завдяки кешуванню.

## Monitoring

Перевіряйте в Render логах:
- Час відповіді API (має зменшитися з кешем)
- Кількість cache hits/misses у логах Nova Poshta сервісу
- Memory usage (стабільне використання пам'яті)

## Тестування Production Кешу

Використовуйте наш тестовий скрипт:

```bash
# Локально
node test-production-cache.js https://your-app.onrender.com

# Або просто у браузері
https://your-app.onrender.com/api/v1/nova-poshta/warehouses?cityRef=db5c88f5-391c-11dd-90d9-001a92567626
```

## Файли для деплою

📁 **Корисні файли:**
- `DEPLOYMENT.md` - це керівництво
- `render-env-example.txt` - приклад environment variables
- `test-production-cache.js` - тестування кешу в production
- `test-cache-performance.ps1` - для тестування кешу

## Швидкий старт для Render.com

1. **Push код на GitHub**
2. **Створіть Web Service на Render** 
3. **Додайте environment variables** (див. `render-env-example.txt`)
4. **Deploy!** 🚀

Кеш працюватиме автоматично - ніяких додаткових налаштувань не потрібно.
Отримайте 15-кратне прискорення API з коробки! 