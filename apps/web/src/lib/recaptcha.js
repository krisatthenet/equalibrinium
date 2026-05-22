import apiServerClient from './apiServerClient.js';

const SITE_KEY = '6LdAefcsAAAAAFYK74a9iG6gRxH3YGI6p32DqW12';

export async function verifyRecaptcha(action) {
  if (typeof window === 'undefined' || !window.grecaptcha?.enterprise) return true;

  try {
    const token = await new Promise((resolve) => {
      window.grecaptcha.enterprise.ready(async () => {
        try {
          resolve(await window.grecaptcha.enterprise.execute(SITE_KEY, { action }));
        } catch {
          resolve(null);
        }
      });
    });

    if (!token) return true; // fail open if token unavailable

    const res = await apiServerClient.fetch('/recaptcha/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });

    const data = await res.json();
    return data.success !== false;
  } catch {
    return true; // fail open on network error
  }
}
