import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx';

const { mocks, fakePb } = vi.hoisted(() => {
  const mocks = {
    onChange: vi.fn(),
    clear: vi.fn(),
    create: vi.fn(),
    authWithPassword: vi.fn(),
    requestVerification: vi.fn(),
    requestPasswordReset: vi.fn(),
  };

  const fakePb = {
    authStore: {
      isValid: false,
      model: null,
      onChange: mocks.onChange,
      clear: mocks.clear,
    },
    collection: () => ({
      create: mocks.create,
      authWithPassword: mocks.authWithPassword,
      requestVerification: mocks.requestVerification,
      requestPasswordReset: mocks.requestPasswordReset,
    }),
  };

  return { mocks, fakePb };
});

vi.mock('@/lib/pocketbaseClient.js', () => ({
  default: fakePb,
  pocketbaseClient: fakePb,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onChange.mockReturnValue(() => {});
  fakePb.authStore.isValid = false;
  fakePb.authStore.model = null;
});

function TestConsumer() {
  const { isAuthenticated, currentUser, userType } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="user">{currentUser?.email ?? 'none'}</span>
      <span data-testid="type">{userType ?? 'none'}</span>
    </div>
  );
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});

describe('AuthProvider', () => {
  it('reports unauthenticated when authStore is invalid', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
  });

  it('subscribes to authStore changes on mount', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mocks.onChange).toHaveBeenCalledOnce();
    });
  });

  it('unsubscribes from authStore on unmount', async () => {
    const unsubscribe = vi.fn();
    mocks.onChange.mockReturnValue(unsubscribe);

    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(mocks.onChange).toHaveBeenCalled());

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('logout clears authStore and sets currentUser to null', async () => {
    function LogoutButton() {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    }

    render(
      <AuthProvider>
        <LogoutButton />
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Logout'));

    act(() => {
      screen.getByText('Logout').click();
    });

    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('login calls authWithPassword and updates currentUser', async () => {
    const fakeRecord = { id: 'u1', email: 'a@b.com', userType: 'client' };
    mocks.authWithPassword.mockResolvedValue({ record: fakeRecord });

    function LoginButton() {
      const { login } = useAuth();
      return <button onClick={() => login('a@b.com', 'pass')}>Login</button>;
    }

    render(
      <AuthProvider>
        <LoginButton />
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Login'));

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(mocks.authWithPassword).toHaveBeenCalledWith('a@b.com', 'pass');
    expect(screen.getByTestId('auth').textContent).toBe('true');
  });

  it('signup creates user and requests email verification', async () => {
    mocks.create.mockResolvedValue({ id: 'u2', email: 'b@c.com' });
    mocks.requestVerification.mockResolvedValue({});

    function SignupButton() {
      const { signup } = useAuth();
      return <button onClick={() => signup('b@c.com', 'pass', 'client')}>Signup</button>;
    }

    render(
      <AuthProvider>
        <SignupButton />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Signup'));

    await act(async () => {
      screen.getByText('Signup').click();
    });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'b@c.com', userType: 'client' })
    );
    expect(mocks.requestVerification).toHaveBeenCalledWith('b@c.com');
  });
});
