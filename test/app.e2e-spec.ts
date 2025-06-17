import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root endpoint', () => {
    it('should return "Hello World!" with correct headers', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toHaveProperty('message', 'Hello World!');
        });
    });

    it('should handle non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should handle invalid HTTP methods', () => {
      return request(app.getHttpServer()).post('/').expect(404);
    });
  });

  describe('API versioning', () => {
    it('should return 404 for non-versioned API routes', () => {
      return request(app.getHttpServer()).get('/api/test').expect(404);
    });

    it('should handle versioned API routes', () => {
      return request(app.getHttpServer()).get('/api/v1').expect(200);
    });
  });
});
