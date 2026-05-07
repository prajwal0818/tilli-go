import crypto from 'crypto';
import config from '../config';
import type { AckTokenData } from '../types';

/**
 * Verify a signed acknowledgement token.
 *
 * Token format: base64url(payload).base64url(hmac)
 * Payload: { taskId, exp }
 *
 * Uses the same HMAC-SHA256 scheme as the worker's signAckToken().
 */
export function verifyAckToken(taskId: string, token: string): AckTokenData {
  if (!token || !token.includes('.')) {
    throw new Error('Malformed token');
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    throw new Error('Malformed token');
  }

  // Recompute HMAC and compare in constant time
  const expected = crypto
    .createHmac('sha256', config.ackTokenSecret)
    .update(payload)
    .digest('base64url');

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new Error('Invalid token signature');
  }

  const data: AckTokenData = JSON.parse(
    Buffer.from(payload, 'base64url').toString()
  );

  if (Date.now() > data.exp) {
    throw new Error('Token expired');
  }

  if (data.taskId !== taskId) {
    throw new Error('Token task ID mismatch');
  }

  return data;
}
