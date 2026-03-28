import { differenceInSeconds } from "date-fns";
import { redis } from "@/lib/redis";
import type { TelegramSyncMessage } from "@/types";

const CACHE_PREFIX = "telegram:last-result";
const LIMIT_PREFIX = "telegram:hourly-limit";

const TRAVEL_KEYWORDS = [
  "restaurant",
  "food",
  "club",
  "bar",
  "beach",
  "hotel",
  "hostel",
  "museum",
  "tour",
  "hike",
  "surf",
  "coffee",
  "cafe",
  "night",
  "morning",
  "budget",
  "cheap",
  "luxury",
  "recommend",
  "hidden",
  "local",
  "must",
  "avoid",
  "best",
  "worst",
  "skip",
  "visit",
  "try",
  "eat",
  "drink",
  "stay",
  "do",
  "see",
  "go",
];

export function synthesizeTelegramMessages(messages: TelegramSyncMessage[]) {
  return messages
    .slice()
    .sort(
      (left, right) =>
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
    )
    .map((message) => `[${message.senderName}] said: ${message.text}`)
    .join("\n");
}

export function containsMeaningfulTravelIntent(text: string) {
  const normalized = text.toLowerCase();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return (
    wordCount >= 20 ||
    TRAVEL_KEYWORDS.some((keyword) => normalized.includes(keyword))
  );
}

export async function shouldUseCachedTelegramReply(tripId: string, text: string) {
  const lastResult = await redis.get(`${CACHE_PREFIX}:${tripId}`);

  if (!lastResult) {
    return null;
  }

  const parsed = JSON.parse(lastResult) as { reply: string; createdAt: string };

  if (!containsMeaningfulTravelIntent(text)) {
    return parsed;
  }

  const age = differenceInSeconds(new Date(), new Date(parsed.createdAt));
  return age < 60 ? parsed : null;
}

export async function cacheTelegramReply(tripId: string, reply: string) {
  await redis.set(
    `${CACHE_PREFIX}:${tripId}`,
    JSON.stringify({
      reply,
      createdAt: new Date().toISOString(),
    }),
    "EX",
    60,
  );
}

export async function incrementTelegramSyncRateLimit(tripId: string) {
  const key = `${LIMIT_PREFIX}:${tripId}:${new Date().toISOString().slice(0, 13)}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600);
  }

  return count;
}
