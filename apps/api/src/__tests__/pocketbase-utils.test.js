import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuthWithPassword = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockCollection = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    authWithPassword: mockAuthWithPassword,
    create: mockCreate,
  })
);

vi.mock('pocketbase', () => ({
  default: vi.fn(function () {
    return { collection: mockCollection };
  }),
}));

const { authenticateUser, registerUser } = await import('../utils/pocketbase.js');

describe('authenticateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns token and user data on success', async () => {
    mockAuthWithPassword.mockResolvedValue({
      token: 'tok-xyz',
      record: { id: 'u1', email: 'a@b.com', name: 'Alice', userType: 'client' },
    });

    const result = await authenticateUser('a@b.com', 'pass');
    expect(result.token).toBe('tok-xyz');
    expect(result.user).toMatchObject({ id: 'u1', email: 'a@b.com', name: 'Alice', userType: 'client' });
  });

  it('defaults name to empty string when record.name is absent', async () => {
    mockAuthWithPassword.mockResolvedValue({
      token: 'tok-xyz',
      record: { id: 'u1', email: 'a@b.com', userType: 'client' },
    });

    const result = await authenticateUser('a@b.com', 'pass');
    expect(result.user.name).toBe('');
  });

  it('defaults userType to "user" when record.userType is absent', async () => {
    mockAuthWithPassword.mockResolvedValue({
      token: 'tok-xyz',
      record: { id: 'u1', email: 'a@b.com' },
    });

    const result = await authenticateUser('a@b.com', 'pass');
    expect(result.user.userType).toBe('user');
  });

  it('throws 401 when PocketBase returns a 400 error', async () => {
    mockAuthWithPassword.mockRejectedValue(Object.assign(new Error('Bad request'), { status: 400 }));

    await expect(authenticateUser('a@b.com', 'wrong')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
  });

  it('throws 401 when PocketBase returns a 404 error', async () => {
    mockAuthWithPassword.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));

    await expect(authenticateUser('a@b.com', 'pass')).rejects.toMatchObject({
      status: 401,
      message: 'User not found',
    });
  });

  it('re-throws with status 500 on unknown errors', async () => {
    mockAuthWithPassword.mockRejectedValue(new Error('Unexpected'));

    await expect(authenticateUser('a@b.com', 'pass')).rejects.toMatchObject({ status: 500 });
  });
});

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns token and user data after creating and authenticating', async () => {
    mockCreate.mockResolvedValue({ id: 'u2', email: 'b@c.com', name: 'Bob', userType: 'client' });
    mockAuthWithPassword.mockResolvedValue({
      token: 'tok-new',
      record: { id: 'u2', email: 'b@c.com', name: 'Bob', userType: 'client' },
    });

    const result = await registerUser('b@c.com', 'pass', 'Bob');
    expect(result.token).toBe('tok-new');
    expect(result.user).toMatchObject({ id: 'u2', email: 'b@c.com' });
  });

  it('throws 400 with a descriptive message when email is already taken', async () => {
    mockCreate.mockRejectedValue(
      Object.assign(new Error('Duplicate'), {
        status: 400,
        data: { email: { code: 'validation_not_unique' } },
      })
    );

    await expect(registerUser('taken@b.com', 'pass')).rejects.toMatchObject({
      status: 400,
      message: 'Email is already registered',
    });
  });

  it('throws 400 on other validation errors from PocketBase', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('Invalid data'), { status: 400 }));

    await expect(registerUser('x@b.com', 'pass')).rejects.toMatchObject({ status: 400 });
  });
});
