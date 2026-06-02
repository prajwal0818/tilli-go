import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import logger from '../config/logger';

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

// Lua script: atomically clean expired entries, add new entry, count, and set TTL.
// Returns the count of entries in the window.
const LUA_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local member = ARGV[3]
local ttl = tonumber(ARGV[4])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
redis.call('ZADD', key, now, member)
local count = redis.call('ZCARD', key)
redis.call('PEXPIRE', key, ttl)
return count
`;

function rateLimiter({ windowMs = 60_000, max = 10, keyPrefix = 'rl' }: RateLimiterOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const member = `${now}:${Math.random()}`;

    try {
      const count = (await redis.eval(LUA_SCRIPT, 1, key, now, windowMs, member, windowMs)) as number;

      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - count)));

      if (count > max) {
        logger.warn({ ip, count, max, key }, 'Rate limit exceeded');
        res.status(429).json({ error: 'Too many requests, try again later' });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request through (fail-open)
      logger.error(err, 'Rate limiter Redis error — failing open');
      next();
    }
  };
}

export = rateLimiter;
