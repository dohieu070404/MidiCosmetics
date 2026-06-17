import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
};

const csvToArray = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const emptyStringToUndefined = (value) => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  APP_NAME: z.string().min(1).default('Midi Cosmetics API'),
  API_PREFIX: z.string().min(1).default('/api/v1'),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  CORS_ORIGIN: z.string().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOGGER_PRETTY: z.string().default('false'),
  TRUST_PROXY: z.string().default('false'),

  // Development-only admin seed. Production must use /api/v1/admin/bootstrap instead.
  ALLOW_ADMIN_SEED: z.string().default('false'),
  DEV_ADMIN_EMAIL: z.preprocess(emptyStringToUndefined, z.string().email().optional()),
  DEV_ADMIN_PASSWORD: z.preprocess(emptyStringToUndefined, z.string().min(8).optional()),
  DEV_ADMIN_FULL_NAME: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),

  // One-time production bootstrap for the first admin account.
  ADMIN_ALLOWED_EMAILS: z.string().default(''),
  ADMIN_BOOTSTRAP_TOKEN: z.preprocess(emptyStringToUndefined, z.string().min(32).optional()),
  ADMIN_BOOTSTRAP_ENABLED: z.string().default('false'),
  ADMIN_LOGIN_PATH: z.string().min(1).default("/quan-tri-midi-secure-2026"),

  SMTP_HOST: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  SMTP_PASS: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  MAIL_FROM: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  ADMIN_ALERT_EMAIL: z.preprocess(emptyStringToUndefined, z.string().email().optional()),
  FRONTEND_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  UPLOAD_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  PUBLIC_UPLOAD_BASE_URL: z.string().optional().default(''),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
  UPLOAD_IMAGE_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
  UPLOAD_SPREADSHEET_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),

  // Deployment/runtime controls. These must remain disabled in production serverless runtime.
  RUN_MIGRATIONS: z.string().default('false'),
  DATABASE_SYNC_STRATEGY: z.enum(['none', 'migrate', 'push']).default('none'),
  SEED_DATABASE: z.string().default('false'),
  AUTO_RESET_FAILED_MIGRATIONS: z.string().default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const envVars = parsed.data;

const assertProductionSafety = () => {
  if (envVars.NODE_ENV !== 'production') return;

  const rejectUnsafeSecret = (name, value) => {
    const normalized = String(value || '').toLowerCase();
    const unsafeMarkers = ['change_me', 'replace_', 'default', 'secret_at_least_32_chars'];
    if (unsafeMarkers.some((marker) => normalized.includes(marker))) {
      throw new Error(`${name} must be set to a strong non-default value when NODE_ENV=production`);
    }
  };

  rejectUnsafeSecret('JWT_ACCESS_SECRET', envVars.JWT_ACCESS_SECRET);
  rejectUnsafeSecret('JWT_REFRESH_SECRET', envVars.JWT_REFRESH_SECRET);

  const allowedOrigins = csvToArray(envVars.CORS_ORIGIN);
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must be an explicit comma-separated whitelist when NODE_ENV=production');
  }

  if (parseBoolean(envVars.ALLOW_ADMIN_SEED)) {
    throw new Error('ALLOW_ADMIN_SEED must be false when NODE_ENV=production');
  }

  if (parseBoolean(envVars.SEED_DATABASE)) {
    throw new Error('SEED_DATABASE must be false when NODE_ENV=production');
  }

  if (parseBoolean(envVars.RUN_MIGRATIONS)) {
    throw new Error('RUN_MIGRATIONS must be false when NODE_ENV=production');
  }

  if (envVars.DATABASE_SYNC_STRATEGY !== 'none') {
    throw new Error('DATABASE_SYNC_STRATEGY must be none when NODE_ENV=production');
  }

  if (parseBoolean(envVars.AUTO_RESET_FAILED_MIGRATIONS)) {
    throw new Error('AUTO_RESET_FAILED_MIGRATIONS must be false when NODE_ENV=production');
  }

  if (envVars.UPLOAD_DRIVER !== 'cloudinary') {
    throw new Error('UPLOAD_DRIVER must be cloudinary when NODE_ENV=production');
  }

  if (envVars.ADMIN_BOOTSTRAP_ENABLED && parseBoolean(envVars.ADMIN_BOOTSTRAP_ENABLED)) {
    if (!envVars.ADMIN_BOOTSTRAP_TOKEN || String(envVars.ADMIN_BOOTSTRAP_TOKEN).length < 32) {
      throw new Error('ADMIN_BOOTSTRAP_TOKEN must be at least 32 characters when ADMIN_BOOTSTRAP_ENABLED=true');
    }

    rejectUnsafeSecret('ADMIN_BOOTSTRAP_TOKEN', envVars.ADMIN_BOOTSTRAP_TOKEN);

    if (csvToArray(envVars.ADMIN_ALLOWED_EMAILS).length === 0) {
      throw new Error('ADMIN_ALLOWED_EMAILS must contain at least one email when ADMIN_BOOTSTRAP_ENABLED=true');
    }
  }
};

assertProductionSafety();

export const env = Object.freeze({
  nodeEnv: envVars.NODE_ENV,
  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  port: envVars.PORT,
  appName: envVars.APP_NAME,
  apiPrefix: envVars.API_PREFIX,
  databaseUrl: envVars.DATABASE_URL,
  directUrl: envVars.DIRECT_URL || '',
  database: {
    url: envVars.DATABASE_URL,
    directUrl: envVars.DIRECT_URL || '',
    syncStrategy: envVars.DATABASE_SYNC_STRATEGY,
    runMigrations: parseBoolean(envVars.RUN_MIGRATIONS),
    seedDatabase: parseBoolean(envVars.SEED_DATABASE),
    autoResetFailedMigrations: parseBoolean(envVars.AUTO_RESET_FAILED_MIGRATIONS),
  },
  auth: {
    jwtAccessSecret: envVars.JWT_ACCESS_SECRET,
    jwtRefreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiresIn: envVars.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
    bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
  },
  cors: {
    origins: csvToArray(envVars.CORS_ORIGIN),
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX,
    authMax: envVars.AUTH_RATE_LIMIT_MAX,
  },
  logger: {
    level: envVars.LOG_LEVEL,
    pretty: parseBoolean(envVars.LOGGER_PRETTY),
  },
  trustProxy: parseBoolean(envVars.TRUST_PROXY),
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  adminLoginPath: envVars.ADMIN_LOGIN_PATH,
  adminSeed: {
    allowAdminSeed: parseBoolean(envVars.ALLOW_ADMIN_SEED),
    devAdminEmail: envVars.DEV_ADMIN_EMAIL || 'admin@midicosmetics.local',
    devAdminPassword: envVars.DEV_ADMIN_PASSWORD || 'Admin@123456',
    devAdminFullName: envVars.DEV_ADMIN_FULL_NAME || 'Midi Admin',
  },
  adminBootstrap: {
    enabled: parseBoolean(envVars.ADMIN_BOOTSTRAP_ENABLED),
    token: envVars.ADMIN_BOOTSTRAP_TOKEN || '',
    allowedEmails: csvToArray(envVars.ADMIN_ALLOWED_EMAILS).map((email) => email.toLowerCase()),
  },
  frontendUrl: envVars.FRONTEND_URL || '',
  email: {
    smtpHost: envVars.SMTP_HOST || '',
    smtpPort: envVars.SMTP_PORT,
    smtpSecure: parseBoolean(envVars.SMTP_SECURE),
    smtpUser: envVars.SMTP_USER || '',
    smtpPass: envVars.SMTP_PASS || '',
    mailFrom: envVars.MAIL_FROM || '',
    adminAlertEmail: envVars.ADMIN_ALERT_EMAIL || '',
    enabled: Boolean(envVars.SMTP_HOST && envVars.MAIL_FROM),
    adminAlertEnabled: Boolean(envVars.SMTP_HOST && envVars.MAIL_FROM && envVars.ADMIN_ALERT_EMAIL),
  },
  upload: {
    driver: envVars.UPLOAD_DRIVER,
    dir: envVars.UPLOAD_DIR,
    publicBaseUrl: envVars.PUBLIC_UPLOAD_BASE_URL,
    maxFileSizeMb: envVars.UPLOAD_MAX_FILE_SIZE_MB,
    imageMaxFileSizeMb: envVars.UPLOAD_IMAGE_MAX_FILE_SIZE_MB,
    spreadsheetMaxFileSizeMb: envVars.UPLOAD_SPREADSHEET_MAX_FILE_SIZE_MB,
  },
});
