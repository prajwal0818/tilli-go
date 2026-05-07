import IORedis from 'ioredis';
import config from './index';

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

export = connection;
