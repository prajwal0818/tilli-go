import 'dotenv/config';
import type { Config } from '../types';

const INSECURE_DEFAULTS = [
  'change-me-in-production',
  'dev-ack-secret-change-in-production',
];

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET;
const ackTokenSecret =
  process.env.ACK_TOKEN_SECRET || 'dev-ack-secret-change-in-production';

if (isProduction) {
  if (!jwtSecret || INSECURE_DEFAULTS.includes(jwtSecret)) {
    throw new Error(
      'FATAL: JWT_SECRET is missing or using an insecure default. Set a strong secret in production.'
    );
  }
  if (!ackTokenSecret || INSECURE_DEFAULTS.includes(ackTokenSecret)) {
    throw new Error(
      'FATAL: ACK_TOKEN_SECRET is missing or using an insecure default. Set a strong secret in production.'
    );
  }
}

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || '';
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
const microsoftEnabled = !!(
  microsoftClientId &&
  microsoftClientSecret &&
  microsoftClientId !== 'your-client-id-here'
);

if (isProduction && microsoftEnabled) {
  const tokenEncKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!tokenEncKey || tokenEncKey.length < 32) {
    throw new Error(
      'FATAL: TOKEN_ENCRYPTION_KEY must be at least 32 characters when Microsoft OAuth is enabled.',
    );
  }
}

const config: Config = {
  apiPort: process.env.API_PORT || 3001,
  jwtSecret,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  ackTokenSecret,
  microsoft: {
    clientId: microsoftClientId,
    clientSecret: microsoftClientSecret,
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    redirectUri:
      process.env.MICROSOFT_REDIRECT_URI ||
      'http://localhost:3001/api/auth/microsoft/callback',
    enabled: microsoftEnabled,
  },
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
};

export = config;
