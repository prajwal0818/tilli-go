import IORedis from 'ioredis';
import config from './index';

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  tls: config.redis.tls ? {} : undefined,
  maxRetriesPerRequest: null,
});

export = connection;
