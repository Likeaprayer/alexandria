import Redis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Redis client
const redisClient = new Redis(process.env.NODE_ENV! == 'production' ? process.env.REDIS_URI_PROD! : process.env.REDIS_URI_DEV!);

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'))



export { redisClient};