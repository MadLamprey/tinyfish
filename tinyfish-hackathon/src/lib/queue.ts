import { JobsOptions, Queue, QueueEvents } from "bullmq";
import { redis } from "@/lib/redis";
import type { TinyFishScrapeJob } from "@/types";

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 30_000,
  },
  removeOnComplete: 100,
  removeOnFail: 100,
};

export const scrapeQueue = new Queue("scrape", {
  connection: redis,
  defaultJobOptions,
});

export const batchScrapeQueue = new Queue<
  { tripId: string; jobs: TinyFishScrapeJob[] },
  void,
  "batch-scrape"
>("batch-scrape", {
  connection: redis,
  defaultJobOptions,
});

export const normalizeQueue = new Queue<
  { tripId: string; scrapeJobId?: string },
  void,
  "normalize-knowledge"
>("normalize-knowledge", {
  connection: redis,
  defaultJobOptions,
});

export const recommendationQueue = new Queue<
  { tripId: string; force?: boolean },
  void,
  "generate-recommendations"
>("generate-recommendations", {
  connection: redis,
  defaultJobOptions,
});

export const telegramDeliveryQueue = new Queue<
  { tripId: string; recommendationIds: string[]; timeOfDay: string },
  void,
  "deliver-to-telegram"
>("deliver-to-telegram", {
  connection: redis,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 1,
  },
});

export const queueEvents = new QueueEvents("scrape", { connection: redis });
