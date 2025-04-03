import Redis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Redis client
const redisClient = new Redis(process.env.NODE_ENV! == 'production' ? process.env.REDIS_URI_PROD! : process.env.REDIS_URI_DEV!);

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.error(`Error connecting to Redis: ${error}`);
    // process.exit(1);
  }
};

export { redisClient, connectRedis };