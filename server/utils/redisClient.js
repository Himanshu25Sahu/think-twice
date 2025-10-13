// utils/redisClient.js
import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Add event handlers **after connecting**
redisClient.connect()
  .then(() => {
    console.log("✅ Redis connected");
    
    // Only after connection, you can attach error event
    redisClient.on("error", (err) => console.error("❌ Redis Client Error:", err));
  })
  .catch((err) => console.error("❌ Redis connection failed:", err));
