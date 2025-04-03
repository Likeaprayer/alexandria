import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../db/redis/init';

export const cacheMiddleware = (durationInSeconds = 3600): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `express:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        // Return cached data
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json(parsedData);
      }

      // Store the original res.json method
      const originalJson = res.json;
      
      // Override res.json method to cache the response
      res.json = function(body) {
        // Store the response in cache before sending
        redisClient.setex(key, durationInSeconds, JSON.stringify(body))
          .catch(err => console.error('Redis cache error:', err));
        
        // Call the original json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Middleware to clear cache for specific patterns
export const clearCache = (pattern: string) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      // Get all keys matching the pattern
      const keys = await redisClient.keys(pattern);
      
      // Delete all matching keys
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      next();
    } catch (error) {
      console.error('Clear cache middleware error:', error);
      next();
    }
  };
};
