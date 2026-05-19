export interface RedisConfig {
  host: string;
  port: number;
}

export interface SmtpConfig {
  host: string | undefined;
  port: number;
  user: string | undefined;
  pass: string | undefined;
}

export interface MicrosoftOAuthConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  enabled: boolean;
}

export interface Config {
  apiPort: number | string;
  jwtSecret: string | undefined;
  redis: RedisConfig;
  smtp: SmtpConfig;
  frontendUrl: string;
  ackTokenSecret: string;
  microsoft: MicrosoftOAuthConfig;
  tokenEncryptionKey: string | undefined;
}
