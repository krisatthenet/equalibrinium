import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorMiddleware } from '../middleware/index.js';

function makeApp(handler) {
  const app = express();
  app.use(express.json());
  app.get('/test', handler);
  app.use(errorMiddleware);
  return app;
}

describe('errorMiddleware', () => {
  it('responds with the error status code', async () => {
    const app = makeApp((_req, _res, next) => {
      next(Object.assign(new Error('Not found'), { status: 404 }));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found');
  });

  it('falls back to 500 when no status is set on the error', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new Error('Boom'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  it('uses statusCode property as a fallback', async () => {
    const app = makeApp((_req, _res, next) => {
      next(Object.assign(new Error('Conflict'), { statusCode: 409 }));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
  });

  it('includes stack trace in non-production environments', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const app = makeApp((_req, _res, next) => {
      next(Object.assign(new Error('Oops'), { status: 500 }));
    });

    const res = await request(app).get('/test');
    expect(res.body.error).toBeDefined();
    expect(res.body.error.stack).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('omits stack trace in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const app = makeApp((_req, _res, next) => {
      next(new Error('Secret'));
    });

    const res = await request(app).get('/test');
    expect(res.body.error).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});
