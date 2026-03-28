import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: IORedis | undefined;
}

export const redis =
  global.redisGlobal ??
  new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== "production") {
  global.redisGlobal = redis;
}
