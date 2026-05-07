import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import logger from '../config/logger';

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

function rateLimiter({ windowMs = 60_000, max = 10, keyPrefix = 'rl' }: RateLimiterOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    try {
      const pipe = redis.pipeline();
      pipe.zremrangebyscore(key, 0, now - windowMs);
      pipe.zadd(key, now, `${now}:${Math.random()}`);
      pipe.zcard(key);
      pipe.pexpire(key, windowMs);

      const results = await pipe.exec();
      const count = (results?.[2]?.[1] as number) ?? 0;

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
