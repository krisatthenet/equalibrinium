const SITE_KEY = '6LdAefcsAAAAAFYK74a9iG6gRxH3YGI6p32DqW12';

export async function getRecaptchaToken(action) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.grecaptcha?.enterprise) {
      resolve(null);
      return;
    }
    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha.enterprise.execute(SITE_KEY, { action });
        resolve(token);
      } catch {
        resolve(null);
      }
    });
  });
}
