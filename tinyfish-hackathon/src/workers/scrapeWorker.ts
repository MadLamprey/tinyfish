import { Worker } from "bullmq";
import { PlaceCategory, ScrapeStatus } from "@prisma/client";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { normalizeQueue, scrapeQueue } from "@/lib/queue";
import { scrapeSingle } from "@/lib/tinyfish";

function inferCategory(platform: string, rawItem: Record<string, unknown>) {
  const text = JSON.stringify(rawItem).toLowerCase();
  if (text.includes("club")) return PlaceCategory.CLUB;
  if (text.includes("bar")) return PlaceCategory.BAR;
  if (text.includes("cafe") || text.includes("coffee")) return PlaceCategory.CAFE;
  if (text.includes("restaurant") || text.includes("food")) return PlaceCategory.RESTAURANT;
  if (text.includes("museum") || text.includes("temple")) return PlaceCategory.ATTRACTION;
  if (text.includes("tour") || text.includes("surf") || text.includes("hike")) return PlaceCategory.ACTIVITY;
  if (platform === "tripadvisor") return PlaceCategory.ACTIVITY;
  return PlaceCategory.OTHER;
}

function toEntries(rawResult: unknown) {
  if (Array.isArray(rawResult)) {
    return rawResult;
  }
  if (rawResult && typeof rawResult === "object") {
    const values = Object.values(rawResult);
    const arrayValue = values.find(Array.isArray);
    if (Array.isArray(arrayValue)) {
      return arrayValue;
    }
  }
  return [];
}

new Worker(
  "batch-scrape",
  async (job) => {
    const { tripId, jobs } = job.data as {
      tripId: string;
      jobs: Array<{ platform: string; url: string; goal: string; stealth: boolean }>;
    };

    for (const item of jobs) {
      const created = await db.scrapeJob.create({
        data: {
          tripId,
          platform: item.platform,
          targetUrl: item.url,
          goal: item.goal,
        },
      });

      await scrapeQueue.add("scrape", {
        scrapeJobId: created.id,
      });
    }
  },
  {
    connection: redis,
  },
);

new Worker(
  "scrape",
  async (job) => {
    const { scrapeJobId } = job.data as { scrapeJobId: string };
    const scrapeJob = await db.scrapeJob.findUnique({
      where: { id: scrapeJobId },
    });

    if (!scrapeJob) {
      throw new Error("Scrape job not found");
    }

    await db.scrapeJob.update({
      where: { id: scrapeJobId },
      data: { status: ScrapeStatus.RUNNING },
    });

    try {
      const rawResult = await scrapeSingle(scrapeJob.targetUrl, scrapeJob.goal, {
        stealth: ["instagram", "tiktok", "lemon8", "google-maps", "tripadvisor"].includes(scrapeJob.platform),
      });
      const entries = toEntries(rawResult);

      for (const item of entries) {
        const rawItem = item as Record<string, unknown>;
        const title = String(
          rawItem.name ??
            rawItem.title ??
            rawItem.location_name ??
            rawItem.username ??
            "Untitled discovery",
        );
        const description = String(
          rawItem.description ??
            rawItem.summary ??
            rawItem.caption ??
            rawItem.content_summary ??
            rawItem.body ??
            "No description available.",
        );
        const embedding = await generateEmbedding(`${title}\n${description}`);

        const entry = await db.knowledgeEntry.create({
          data: {
            tripId: scrapeJob.tripId,
            scrapeJobId: scrapeJob.id,
            category: inferCategory(scrapeJob.platform, rawItem),
            title,
            description,
            sourceUrl: String(rawItem.url ?? rawItem.sourceUrl ?? scrapeJob.targetUrl),
            sourcePlatform: scrapeJob.platform,
            location: {
              address: rawItem.address ?? null,
              neighborhood: rawItem.neighborhood ?? null,
              city: rawItem.city ?? null,
              lat: rawItem.lat ?? null,
              lng: rawItem.lng ?? null,
            },
            tags: Array.isArray(rawItem.tags) ? (rawItem.tags as string[]) : [],
            imageUrls: Array.isArray(rawItem.image_urls)
              ? (rawItem.image_urls as string[])
              : rawItem.image_url
                ? [String(rawItem.image_url)]
                : [],
            rawData: rawItem,
            confidence: 0.6,
          },
        });

        await db.$executeRaw`
          UPDATE "KnowledgeEntry"
          SET embedding = ${`[${embedding.join(",")}]`}::vector
          WHERE id = ${entry.id}
        `;
      }

      await db.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: ScrapeStatus.COMPLETED,
          resultRaw: rawResult as object,
          completedAt: new Date(),
        },
      });

      await normalizeQueue.add("normalize-knowledge", {
        tripId: scrapeJob.tripId,
        scrapeJobId: scrapeJob.id,
      });
    } catch (error) {
      await db.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: ScrapeStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : "Unknown TinyFish failure",
        },
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);
