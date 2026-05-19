import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as msal from '@azure/msal-node';
import prisma from '../config/prisma';
import config from '../config';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { getMicrosoftConfig } from '../config/microsoft';
import { getMsalClient } from '../services/msalService';
import { findOrCreateOAuthUser } from '../services/oauthService';
import { fetchProfilePhoto } from '../services/graphService';
import logger from '../config/logger';
import type { JwtTokenPayload, AuthResponse } from '../types';

function signToken(user: { id: string; email: string; role: string; name: string }): string {
  const payload: JwtTokenPayload = { sub: user.id, email: user.email, role: user.role, name: user.name };
  return jwt.sign(payload, config.jwtSecret!, { expiresIn: '24h' });
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name, oauthProvider: 'local' },
    });

    const token = signToken(user);

    const body: AuthResponse = {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };

    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        error: 'This account uses Microsoft sign-in. Please use the "Sign in with Microsoft" button.',
      });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken(user);

    const body: AuthResponse = {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };

    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/microsoft — Initiate OAuth redirect
export const microsoftLogin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const msConfig = getMicrosoftConfig();
    if (!msConfig.enabled) {
      res.status(404).json({ error: 'Microsoft login is not configured' });
      return;
    }

    const msalClient = getMsalClient();
    const cryptoProvider = new msal.CryptoProvider();
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    // Store PKCE verifier in a short-lived httpOnly cookie
    res.cookie('pkce_verifier', verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/api/auth',
    });

    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: msConfig.scopes,
      redirectUri: msConfig.redirectUri,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      prompt: 'select_account',
    });

    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/microsoft/callback — Handle OAuth callback
export const microsoftCallback = async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = config.frontendUrl;

  try {
    const msConfig = getMicrosoftConfig();
    const msalClient = getMsalClient();
    const code = req.query.code as string | undefined;
    const verifier = req.cookies?.pkce_verifier as string | undefined;

    if (!code) {
      const errorDesc =
        (req.query.error_description as string) ||
        (req.query.error as string) ||
        'No authorization code received';
      logger.warn({ error: errorDesc }, 'Microsoft OAuth callback missing code');
      res.redirect(`${frontendUrl}/#/login?error=${encodeURIComponent(errorDesc)}`);
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: msConfig.scopes,
      redirectUri: msConfig.redirectUri,
      codeVerifier: verifier || undefined,
    });

    // Clear PKCE cookie
    res.clearCookie('pkce_verifier', { path: '/api/auth' });

    const account = tokenResponse.account;
    if (!account) {
      logger.warn('Microsoft OAuth: no account in token response');
      res.redirect(`${frontendUrl}/#/login?error=no_account`);
      return;
    }

    const claims = tokenResponse.idTokenClaims as Record<string, unknown> | undefined;
    const email =
      account.username ||
      (claims?.email as string) ||
      (claims?.preferred_username as string) ||
      '';
    const displayName =
      account.name ||
      (claims?.name as string) ||
      email;
    const microsoftId =
      account.localAccountId ||
      account.homeAccountId ||
      '';

    if (!email) {
      logger.warn('Microsoft OAuth: no email in token response');
      res.redirect(`${frontendUrl}/#/login?error=no_email`);
      return;
    }

    // Fetch profile photo (non-blocking — failure is acceptable)
    let profilePicture: string | null = null;
    if (tokenResponse.accessToken) {
      profilePicture = await fetchProfilePhoto(tokenResponse.accessToken);
    }

    // Token expiry
    const expiresAt = tokenResponse.expiresOn || new Date(Date.now() + 3600 * 1000);

    // Find or create user
    const user = await findOrCreateOAuthUser({
      provider: 'microsoft',
      providerId: microsoftId,
      email,
      displayName,
      accessToken: tokenResponse.accessToken,
      refreshToken: undefined, // MSAL handles refresh internally
      tokenExpiresAt: expiresAt,
      profilePicture,
    });

    // Sign JWT (same format as local auth)
    const token = signToken(user);

    // Redirect to frontend with token in query param
    res.redirect(`${frontendUrl}/#/auth/callback?token=${token}`);
  } catch (error: any) {
    logger.error(
      { err: error.message, stack: error.stack },
      'Microsoft OAuth callback failed',
    );
    res.redirect(`${frontendUrl}/#/login?error=oauth_failed`);
  }
};

// GET /api/auth/me — Return current user profile
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        oauthProvider: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/microsoft/status — Check if Microsoft OAuth is configured
export const microsoftStatus = (_req: Request, res: Response): void => {
  const msConfig = getMicrosoftConfig();
  res.json({ enabled: msConfig.enabled });
};
