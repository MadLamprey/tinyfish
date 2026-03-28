import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { generateRecommendationsForTrip } from "@/lib/ai/recommender";
import { sendTelegramRecommendations } from "@/lib/telegram/delivery";

new Worker(
  "generate-recommendations",
  async (job) => {
    const { tripId } = job.data as { tripId: string };
    await generateRecommendationsForTrip(tripId);
  },
  {
    connection: redis,
  },
);

new Worker(
  "deliver-to-telegram",
  async (job) => {
    const { tripId, recommendationIds, timeOfDay } = job.data as {
      tripId: string;
      recommendationIds: string[];
      timeOfDay: string;
    };

    try {
      await sendTelegramRecommendations(tripId, recommendationIds, timeOfDay);
    } catch (error) {
      await db.telegramSync.updateMany({
        where: { tripId },
        data: { isActive: false },
      });
      console.warn("Telegram delivery failed", error);
    }
  },
  {
    connection: redis,
  },
);
