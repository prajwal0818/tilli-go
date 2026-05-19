export interface MicrosoftConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  authority: string;
  scopes: string[];
  enabled: boolean;
}

export function getMicrosoftConfig(): MicrosoftConfig {
  const clientId = process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    'http://localhost:3001/api/auth/microsoft/callback';

  const enabled = !!(
    clientId &&
    clientSecret &&
    clientId !== 'your-client-id-here'
  );

  return {
    clientId,
    clientSecret,
    tenantId,
    redirectUri,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    scopes: ['openid', 'profile', 'email', 'User.Read', 'offline_access'],
    enabled,
  };
}
