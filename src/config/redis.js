const { createClient } = require("redis");

let redisClient;

const connectRedis = async () => {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  await redisClient.connect();
  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) throw new Error("Redis not initialized. Call connectRedis() first.");
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
