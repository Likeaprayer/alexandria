import { createCl } from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.error(`Error connecting to Redis: ${error}`);
    process.exit(1);
  }
};

export { redisClient, connectRedis };