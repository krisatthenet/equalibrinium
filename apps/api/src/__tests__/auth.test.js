import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../test-utils/createApp.js';

vi.mock('../utils/pocketbase.js', () => ({
  authenticateUser: vi.fn(),
  getPocketBase: vi.fn(),
  default: vi.fn(),
}));

const { authenticateUser } = await import('../utils/pocketbase.js');

describe('POST /auth/register', () => {
  const app = createApp();

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/register').send({ password: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with ok:true for valid credentials', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('POST /auth/login', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/login').send({ password: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email and password are required/i);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with token and user on successful login', async () => {
    authenticateUser.mockResolvedValue({
      token: 'tok-abc',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', userType: 'client' },
    });

    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('tok-abc');
    expect(res.body.user).toMatchObject({ email: 'a@b.com', userType: 'client' });
  });

  it('returns 401 when credentials are wrong', async () => {
    const err = Object.assign(new Error('Invalid email or password'), { status: 401 });
    authenticateUser.mockRejectedValue(err);

    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 500 on unexpected errors', async () => {
    authenticateUser.mockRejectedValue(new Error('DB down'));

    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'p' });
    expect(res.status).toBe(500);
  });
});
