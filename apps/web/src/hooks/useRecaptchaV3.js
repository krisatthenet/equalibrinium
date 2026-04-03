import { useState, useEffect, useCallback } from 'react';

const RECAPTCHA_SITE_KEY = '6LdRYIssAAAAAOGnhU8bU_jJdqPNpZeNJmyaIhcr';

export const useRecaptchaV3 = (action) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const executeRecaptcha = useCallback(async (actionName = action) => {
    setLoading(true);
    console.log(`[reCaptcha] Executing for action: ${actionName}`);
    
    return new Promise((resolve) => {
      // 5-second timeout fallback
      const timeoutId = setTimeout(() => {
        console.log('[reCaptcha] Token generation timed out after 5 seconds');
        setToken(null);
        setLoading(false);
        resolve(null);
      }, 5000);

      const doExecute = async () => {
        try {
          console.log('[reCaptcha] Calling grecaptcha.execute...');
          const t = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: actionName });
          console.log('[reCaptcha] Token received:', t ? t.substring(0, 10) + '...' : 'null');
          clearTimeout(timeoutId);
          setToken(t);
          setLoading(false);
          resolve(t);
        } catch (err) {
          console.error('[reCaptcha] Execution error:', err);
          clearTimeout(timeoutId);
          setError(err);
          setToken(null);
          setLoading(false);
          resolve(null);
        }
      };

      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(doExecute);
      } else {
        console.log('[reCaptcha] grecaptcha not ready yet, waiting...');
        // The timeout will handle it if it never becomes ready within 5s
      }
    });
  }, [action]);

  useEffect(() => {
    const scriptId = 'recaptcha-v3-script';
    
    const checkReady = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        executeRecaptcha();
        return true;
      }
      return false;
    };

    if (document.getElementById(scriptId)) {
      if (!checkReady()) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (checkReady() || attempts > 20) {
            clearInterval(interval);
          }
        }, 250);
      }
      return;
    }

    console.log('[reCaptcha] Loading script...');
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[reCaptcha] Script loaded successfully');
      checkReady();
    };

    script.onerror = () => {
      console.error('[reCaptcha] Failed to load script');
      setError(new Error('Failed to load reCaptcha script'));
      setLoading(false);
      setToken(null);
    };

    document.head.appendChild(script);
  }, [executeRecaptcha]);

  return { token, loading, error, executeRecaptcha };
};