import { useEffect, useRef, useState } from 'react';

let recaptchaLoader;

const loadRecaptcha = () => {
  if (globalThis.grecaptcha?.render) return Promise.resolve(globalThis.grecaptcha);
  if (recaptchaLoader) return recaptchaLoader;
  recaptchaLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-midi-recaptcha]');
    const script = existing || document.createElement('script');
    const ready = () => globalThis.grecaptcha?.ready(() => resolve(globalThis.grecaptcha));
    script.addEventListener('load', ready, { once: true });
    script.addEventListener('error', () => reject(new Error('Không tải được Google reCAPTCHA.')), {
      once: true,
    });
    if (!existing) {
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.midiRecaptcha = 'true';
      document.head.appendChild(script);
    }
  });
  return recaptchaLoader;
};

export function GoogleRecaptcha({ siteKey, onChange, resetNonce = 0 }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [error, setError] = useState(siteKey ? '' : 'Thiếu VITE_RECAPTCHA_SITE_KEY.');

  useEffect(() => {
    let cancelled = false;
    if (!siteKey) return undefined;
    loadRecaptcha()
      .then((api) => {
        if (cancelled || !containerRef.current || widgetRef.current !== null) return;
        widgetRef.current = api.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onChange?.(token),
          'expired-callback': () => onChange?.(''),
          'error-callback': () => {
            setError('Google reCAPTCHA đang gián đoạn. Vui lòng thử lại.');
            onChange?.('');
          },
        });
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [onChange, siteKey]);

  useEffect(() => {
    if (widgetRef.current !== null && globalThis.grecaptcha?.reset) {
      globalThis.grecaptcha.reset(widgetRef.current);
      onChange?.('');
    }
  }, [onChange, resetNonce]);

  return (
    <div className="grid gap-2">
      <div ref={containerRef} className="min-h-[78px] max-w-full overflow-x-auto" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
