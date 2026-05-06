import { useState, useEffect, useCallback } from 'react';

export const useRecaptchaEnterprise = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    const scriptId = 'recaptcha-enterprise-script';

    if (!siteKey) {
      setLoadError(new Error('reCaptcha site key is not configured. Set VITE_RECAPTCHA_SITE_KEY in your environment.'));
      setIsLoaded(false);
      return;
    }

    const checkReady = () => {
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        window.grecaptcha.enterprise.ready(() => {
          setIsLoaded(true);
          setLoadError(null);
        });
        return true;
      }
      return false;
    };

    // Ensure script only loads once
    if (document.getElementById(scriptId)) {
      if (!checkReady()) {
        // If script exists but not ready, poll briefly
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (checkReady() || attempts > 20) {
            clearInterval(interval);
          }
        }, 500);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    // Load from the requested URL
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      checkReady();
    };

    script.onerror = () => {
      console.error('[reCaptcha] Failed to load script');
      setLoadError(new Error('Failed to load reCaptcha script'));
      setIsLoaded(false);
    };

    document.head.appendChild(script);
  }, [siteKey]);

  const executeRecaptcha = useCallback(async (actionName) => {
    if (!isLoaded || !window.grecaptcha?.enterprise) {
      console.error('[reCaptcha Hook] reCaptcha not loaded or initialized');
      return null;
    }

    try {
      const token = await window.grecaptcha.enterprise.execute(siteKey, { action: actionName });
      if (!token || typeof token !== 'string') {
         console.error('[reCaptcha Hook] Invalid token received');
         return null;
      }
      return token;
    } catch (err) {
      console.error('[reCaptcha Hook] Execution error:', err);
      return null;
    }
  }, [isLoaded, siteKey]);

  return { isLoaded, loadError, executeRecaptcha };
};