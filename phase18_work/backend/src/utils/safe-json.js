const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwordHash/i,
  /^token$/i,
  /bootstrapToken/i,
  /accessToken/i,
  /refreshToken/i,
  /secret/i,
  /smtp.*pass/i,
  /smtp.*user/i,
  /authorization/i,
  /^cookie$/i,
  /jwt/i,
];

const isSensitiveKey = (key = '') => SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(String(key)));

const isDecimalLike = (value) => {
  if (!value || typeof value !== 'object') return false;
  if (value.constructor?.name === 'Decimal') return true;
  if (typeof value.toFixed === 'function' && typeof value.toNumber === 'function') return true;
  if (typeof value.toString === 'function' && Array.isArray(value.d) && typeof value.e === 'number' && typeof value.s === 'number') return true;
  return false;
};

const serializeJsonValue = (input, { redactSensitive = false } = {}) => {
  if (input === null || input === undefined) return input;

  if (typeof input === 'bigint') return input.toString();

  if (input instanceof Date) return input.toISOString();

  if (isDecimalLike(input)) return input.toString();

  if (Array.isArray(input)) return input.map((item) => serializeJsonValue(item, { redactSensitive }));

  if (typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = redactSensitive && isSensitiveKey(key)
        ? '[REDACTED]'
        : serializeJsonValue(value, { redactSensitive });
      return acc;
    }, {});
  }

  return input;
};

// Used for API responses. It only converts Date/Decimal/BigInt to JSON-safe values.
// Do not redact tokens here, because login/refresh responses must return accessToken to the frontend.
export const toSafeJson = (input) => serializeJsonValue(input, { redactSensitive: false });

// Used for logs/audit records only. This version redacts passwords, tokens, cookies and secrets.
export const toRedactedJson = (input) => serializeJsonValue(input, { redactSensitive: true });
