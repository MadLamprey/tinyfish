import { Worker } from "bullmq";
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
    await sendTelegramRecommendations(tripId, recommendationIds, timeOfDay);
  },
  {
    connection: redis,
  },
);
