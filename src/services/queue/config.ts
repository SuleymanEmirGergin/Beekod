import { ConnectionOptions } from 'bullmq';

const redisHost = process.env.REDIS_HOST?.trim() || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD?.trim();

export const connection: ConnectionOptions = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
};

export const QUEUE_NAME = 'beekod-jobs';
