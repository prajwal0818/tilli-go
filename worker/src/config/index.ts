import 'dotenv/config';

interface WorkerConfig {
  redis: { host: string; port: number };
  smtp: {
    host: string | undefined;
    port: number;
    user: string | undefined;
    pass: string | undefined;
  };
  email: {
    domain: string;
    fromAddress: string | null;
    fromName: string;
    fallbackTeam: string;
  };
  microsoft: {
    mailEnabled: boolean;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    mailFrom: string;
  };
  frontendUrl: string;
  ackTokenSecret: string;
  ackTokenExpiryMs: number;
}

const INSECURE_DEFAULTS = [
  'change-me-in-production',
  'dev-ack-secret-change-in-production',
];

const isProduction = process.env.NODE_ENV === 'production';

const ackTokenSecret =
  process.env.ACK_TOKEN_SECRET || 'dev-ack-secret-change-in-production';

if (isProduction) {
  if (!ackTokenSecret || INSECURE_DEFAULTS.includes(ackTokenSecret)) {
    throw new Error(
      'FATAL: ACK_TOKEN_SECRET is missing or using an insecure default. Set a strong secret in production.',
    );
  }
}

const config: WorkerConfig = {
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
  email: {
    domain: process.env.EMAIL_DOMAIN || 'tilli.pro',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || null,
    fromName: process.env.EMAIL_FROM_NAME || 'Tilli-go',
    fallbackTeam: process.env.EMAIL_FALLBACK_TEAM || 'ops',
  },
  microsoft: {
    mailEnabled: process.env.MICROSOFT_MAIL_ENABLED === 'true',
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.MICROSOFT_TENANT_ID || '',
    mailFrom: process.env.MICROSOFT_MAIL_FROM || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  ackTokenSecret,
  ackTokenExpiryMs:
    parseInt(process.env.ACK_TOKEN_EXPIRY_MS ?? '0', 10) || 7 * 24 * 60 * 60 * 1000,
};

export = config;
