import prisma from '../config/prisma';
import { encrypt } from '../utils/encryption';
import logger from '../config/logger';

interface OAuthUserData {
  provider: string;
  providerId: string;
  email: string;
  displayName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  profilePicture?: string | null;
}

export async function findOrCreateOAuthUser(data: OAuthUserData) {
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY is required for OAuth');
  }

  // Step 1: Find by OAuth credentials
  let user = await prisma.user.findFirst({
    where: { oauthProvider: data.provider, oauthId: data.providerId },
  });

  if (user) {
    const updateData: Record<string, unknown> = {};
    if (data.accessToken) {
      updateData.oauthAccessToken = encrypt(data.accessToken, encryptionKey);
    }
    if (data.refreshToken) {
      updateData.oauthRefreshToken = encrypt(data.refreshToken, encryptionKey);
    }
    if (data.tokenExpiresAt) {
      updateData.oauthTokenExpiresAt = data.tokenExpiresAt;
    }
    if (data.profilePicture !== undefined) {
      updateData.profilePicture = data.profilePicture;
    }
    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }
    logger.info({ email: data.email }, 'OAuth user found and tokens updated');
    return user;
  }

  // Step 2: Find by email (auto-link existing local account)
  user = await prisma.user.findUnique({ where: { email: data.email } });

  if (user) {
    logger.info({ email: data.email }, 'Linking existing user to Microsoft OAuth');
    const updateData: Record<string, unknown> = {
      oauthProvider: data.provider,
      oauthId: data.providerId,
      name: data.displayName || user.name,
    };
    if (data.accessToken) {
      updateData.oauthAccessToken = encrypt(data.accessToken, encryptionKey);
    }
    if (data.refreshToken) {
      updateData.oauthRefreshToken = encrypt(data.refreshToken, encryptionKey);
    }
    if (data.tokenExpiresAt) {
      updateData.oauthTokenExpiresAt = data.tokenExpiresAt;
    }
    if (data.profilePicture) {
      updateData.profilePicture = data.profilePicture;
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    return user;
  }

  // Step 3: Create new user
  logger.info({ email: data.email }, 'Creating new user from Microsoft OAuth');
  user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.displayName,
      password: null,
      role: 'user',
      oauthProvider: data.provider,
      oauthId: data.providerId,
      oauthAccessToken: data.accessToken
        ? encrypt(data.accessToken, encryptionKey)
        : null,
      oauthRefreshToken: data.refreshToken
        ? encrypt(data.refreshToken, encryptionKey)
        : null,
      oauthTokenExpiresAt: data.tokenExpiresAt || null,
      profilePicture: data.profilePicture || null,
    },
  });
  return user;
}
