const { getRedisClient } = require("../config/redis");

// Rate limit: max 20 requests per minute per IP
const rateLimiter = async (req, res, next) => {
  try {
    const redis = getRedisClient();
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate:${ip}`;

    const requests = await redis.incr(key);

    // Set expiry on first request
    if (requests === 1) {
      await redis.expire(key, 60); // 60 seconds window
    }

    // Add headers so client knows their limit status
    res.setHeader("X-RateLimit-Limit", 20);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, 20 - requests));

    if (requests > 20) {
      return res.status(429).json({
        error: "Too many requests. Please wait a minute before trying again.",
      });
    }

    next();
  } catch (error) {
    // If Redis is down, don't block the request — just log it
    console.error("Rate limiter error:", error.message);
    next();
  }
};

module.exports = rateLimiter;
