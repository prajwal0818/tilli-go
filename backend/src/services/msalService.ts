import * as msal from '@azure/msal-node';
import { getMicrosoftConfig } from '../config/microsoft';

let msalInstance: msal.ConfidentialClientApplication | null = null;

export function getMsalClient(): msal.ConfidentialClientApplication {
  if (!msalInstance) {
    const config = getMicrosoftConfig();
    msalInstance = new msal.ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: config.authority,
      },
      system: {
        loggerOptions: {
          logLevel: msal.LogLevel.Warning,
          piiLoggingEnabled: false,
        },
      },
    });
  }
  return msalInstance;
}
