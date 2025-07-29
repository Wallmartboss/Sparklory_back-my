/* eslint-disable prettier/prettier */
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from './core/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration from environment
  const port = configService.get<number>('PORT', 5000);
  const allowedOrigins = configService.get<string[]>('ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://frontend-sparklory.onrender.com',
  ]);

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe());

  // CORS configuration
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Frame-Options',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  // Додаю парсер для form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Глобальний логгер всіх запитів
  app.use((req, res, next) => {
    console.log('[GLOBAL REQUEST]', req.method, req.url, 'body:', req.body);
    next();
  });

  // Middleware to disable Swagger caching
  app.use('/api/docs', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Sparklory')
    .setDescription('Sparklory API Documentation')
    .setVersion('1.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Sparklory')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger setup with disabled caching
  SwaggerModule.setup('/api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      // Disable Swagger UI caching
      cacheControl: 'no-cache, no-store, must-revalidate',
      // Add headers to disable caching
      customHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
    customSiteTitle: 'Sparklory API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .scheme-container { background: #f8fafc; }
    `,
  });

  // Start the server
  await app.listen(port);
  console.log(`Server started on port: ${port}`);
}

bootstrap();
