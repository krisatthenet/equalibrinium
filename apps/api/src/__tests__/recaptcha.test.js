import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyRecaptchaToken } from '../utils/recaptcha.js';

describe('verifyRecaptchaToken', () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.restoreAllMocks();
  });

  it('throws 400 when token is an empty string', async () => {
    await expect(verifyRecaptchaToken('', 'login')).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 when token is whitespace only', async () => {
    await expect(verifyRecaptchaToken('   ', 'login')).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 when token is not a string', async () => {
    await expect(verifyRecaptchaToken(null, 'login')).rejects.toMatchObject({ status: 400 });
  });

  it('throws 500 when RECAPTCHA_SECRET_KEY env var is missing', async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    await expect(verifyRecaptchaToken('valid-token', 'login')).rejects.toMatchObject({ status: 500 });
  });

  it('returns valid:true with score 0.5 for fallback tokens without calling Google', async () => {
    const result = await verifyRecaptchaToken('fallback_token_abc123', 'login');
    expect(result).toEqual({ valid: true, score: 0.5 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns valid:false when Google reports success:false', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    });

    const result = await verifyRecaptchaToken('some-token', 'login');
    expect(result).toEqual({ valid: false, score: 0 });
  });

  it('returns valid:false when the action does not match', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'register', score: 0.9 }),
    });

    const result = await verifyRecaptchaToken('some-token', 'login');
    expect(result).toEqual({ valid: false, score: 0 });
  });

  it('returns valid:false when score is below 0.5', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'login', score: 0.3 }),
    });

    const result = await verifyRecaptchaToken('some-token', 'login');
    expect(result).toEqual({ valid: false, score: 0.3 });
  });

  it('returns valid:true when score meets the threshold', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'login', score: 0.8 }),
    });

    const result = await verifyRecaptchaToken('some-token', 'login');
    expect(result).toEqual({ valid: true, score: 0.8 });
  });

  it('throws 502 when the Google reCAPTCHA API is unreachable', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    await expect(verifyRecaptchaToken('some-token', 'login')).rejects.toMatchObject({ status: 502 });
  });
});
