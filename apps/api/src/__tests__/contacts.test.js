import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../test-utils/createApp.js';

vi.mock('../utils/pocketbase.js', () => ({
  getPocketBase: vi.fn(),
  default: vi.fn(),
}));

vi.mock('../utils/recaptcha.js', () => ({
  verifyRecaptchaToken: vi.fn(),
}));

const { getPocketBase } = await import('../utils/pocketbase.js');
const { verifyRecaptchaToken } = await import('../utils/recaptcha.js');

const validPayload = {
  name: 'Alice',
  email: 'alice@example.com',
  subject: 'Hello',
  message: 'Test message',
  recaptchaToken: 'tok-123',
};

describe('POST /contacts', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    verifyRecaptchaToken.mockResolvedValue({ valid: true, score: 0.9 });
    getPocketBase.mockReturnValue({
      collection: () => ({
        create: vi.fn().mockResolvedValue({ id: 'c1', name: 'Alice', email: 'alice@example.com' }),
      }),
    });
  });

  it('returns 400 when name is missing', async () => {
    const { name: _, ...body } = validPayload;
    const res = await request(app).post('/contacts').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name, email, subject, and message are required/i);
  });

  it('returns 400 when email is missing', async () => {
    const { email: _, ...body } = validPayload;
    const res = await request(app).post('/contacts').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when subject is missing', async () => {
    const { subject: _, ...body } = validPayload;
    const res = await request(app).post('/contacts').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is missing', async () => {
    const { message: _, ...body } = validPayload;
    const res = await request(app).post('/contacts').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when recaptchaToken is missing', async () => {
    const { recaptchaToken: _, ...body } = validPayload;
    const res = await request(app).post('/contacts').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/recaptcha token is required/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/contacts').send({ ...validPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  it('returns 400 for an invalid category', async () => {
    const res = await request(app).post('/contacts').send({ ...validPayload, category: 'Spam' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/category must be one of/i);
  });

  it('returns 400 when recaptcha verification fails', async () => {
    verifyRecaptchaToken.mockResolvedValue({ valid: false, score: 0.1 });

    const res = await request(app).post('/contacts').send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/security verification failed/i);
  });

  it('returns 201 with contact data on success', async () => {
    const res = await request(app).post('/contacts').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/received successfully/i);
    expect(res.body.contactId).toBe('c1');
    expect(res.body.recaptchaScore).toBe(0.9);
  });

  it('accepts a valid category', async () => {
    const res = await request(app).post('/contacts').send({ ...validPayload, category: 'Support' });
    expect(res.status).toBe(201);
  });
});
