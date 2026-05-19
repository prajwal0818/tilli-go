import axios from 'axios';
import logger from '../config/logger';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  // Return cached token if still valid (5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET are required for Graph email',
    );
  }

  const response = await axios.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  cachedToken = {
    token: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000,
  };

  logger.info('Acquired Microsoft Graph app-only token for email');
  return cachedToken.token;
}

export async function sendEmailViaGraph(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<string> {
  const token = await getAppToken();
  const fromAddress = process.env.MICROSOFT_MAIL_FROM;

  if (!fromAddress) {
    throw new Error('MICROSOFT_MAIL_FROM is required for Graph email');
  }

  await axios.post(
    `https://graph.microsoft.com/v1.0/users/${fromAddress}/sendMail`,
    {
      message: {
        subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: false,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const messageId = `graph-${Date.now()}`;
  logger.info({ to, subject, messageId }, 'Email sent via Microsoft Graph');
  return messageId;
}
