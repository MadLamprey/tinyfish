import { Worker } from "bullmq";
import { MessageRole, MessageSource, PlaceCategory, ScrapeStatus } from "@prisma/client";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { normalizeQueue } from "@/lib/queue";
import { scrapeBatch, getRunStatus } from "@/lib/tinyfish";

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

function toEntries(rawResult: unknown): unknown[] {
  // TinyFish may return a JSON string — parse it first
  let data = rawResult;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object") {
    const values = Object.values(data);
    const arrayValue = values.find(Array.isArray);
    if (Array.isArray(arrayValue)) {
      return arrayValue;
    }
    // Single object with place-like keys → wrap it
    if ("name" in data || "title" in data) {
      return [data];
    }
  }
  return [];
}

const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 90_000;

async function pollUntilComplete(runId: string): Promise<unknown> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await getRunStatus(runId);
    if (status.status === "COMPLETED" && status.result !== undefined) {
      return status.result;
    }
    if (status.status === "FAILED") {
      throw new Error(`TinyFish run ${runId} failed`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`TinyFish run ${runId} timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function processResult(
  scrapeJob: { id: string; tripId: string; platform: string; targetUrl: string },
  rawResult: unknown,
) {
  const entries = toEntries(rawResult);
  console.log(`[scrapeWorker] ${scrapeJob.platform}: raw type=${typeof rawResult}, parsed ${entries.length} entries`);
  if (!entries.length) {
    console.warn(`[scrapeWorker] ${scrapeJob.platform}: empty entries. Raw preview:`, JSON.stringify(rawResult).slice(0, 500));
  }

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
        rawData: rawItem as object,
        confidence: 0.6,
      },
    });

    // Embedding is best-effort — don't block entry creation
    try {
      const embedding = await generateEmbedding(`${title}\n${description}`);
      await db.$executeRaw`
        UPDATE "KnowledgeEntry"
        SET embedding = ${`[${embedding.join(",")}]`}::vector
        WHERE id = ${entry.id}
      `;
    } catch {
      console.warn(`[scrapeWorker] embedding failed for entry ${entry.id}, skipping`);
    }
  }

  await db.scrapeJob.update({
    where: { id: scrapeJob.id },
    data: {
      status: ScrapeStatus.COMPLETED,
      resultRaw: rawResult as object,
      completedAt: new Date(),
    },
  });

  const topNames = entries
    .slice(0, 3)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return String(r.name ?? r.title ?? r.location_name ?? "");
    })
    .filter(Boolean);

  const summary =
    topNames.length > 0
      ? `Found ${entries.length} result${entries.length === 1 ? "" : "s"} from **${scrapeJob.platform}** — including ${topNames.join(", ")}${entries.length > 3 ? `, and ${entries.length - 3} more` : ""}.`
      : `Found ${entries.length} result${entries.length === 1 ? "" : "s"} from **${scrapeJob.platform}**.`;

  await db.conversationMessage.create({
    data: {
      tripId: scrapeJob.tripId,
      role: MessageRole.ASSISTANT,
      content: summary,
      source: MessageSource.WEB,
      senderName: "Research Agent",
    },
  });

  await normalizeQueue.add("normalize-knowledge", {
    tripId: scrapeJob.tripId,
    scrapeJobId: scrapeJob.id,
  });
}

new Worker(
  "batch-scrape",
  async (job) => {
    const { tripId, jobs } = job.data as {
      tripId: string;
      jobs: Array<{ platform: string; url: string; goal: string; stealth: boolean }>;
    };

    console.log(`[scrapeWorker] batch-scrape picked up: ${jobs.length} jobs for trip ${tripId}`);

    // Create all DB records up front
    const scrapeJobs = await Promise.all(
      jobs.map((item) =>
        db.scrapeJob.create({
          data: {
            tripId,
            platform: item.platform,
            targetUrl: item.url,
            goal: item.goal,
            status: ScrapeStatus.RUNNING,
          },
        }),
      ),
    );

    // Submit all URLs to TinyFish in one batch request
    const runIds = await scrapeBatch(
      jobs.map((item) => ({ url: item.url, goal: item.goal, stealth: item.stealth })),
    );

    // Poll all run IDs concurrently and process each result as it lands
    await Promise.all(
      scrapeJobs.map(async (scrapeJob, i) => {
        const runId = runIds[i];
        try {
          console.log(`[scrapeWorker] polling run ${runId} for ${scrapeJob.platform}...`);
          const rawResult = await pollUntilComplete(runId);
          console.log(`[scrapeWorker] run ${runId} completed, processing results...`);
          await processResult(scrapeJob, rawResult);
          console.log(`[scrapeWorker] ${scrapeJob.platform} done`);
        } catch (error) {
          console.error(`[scrapeWorker] ${scrapeJob.platform} failed:`, error);
          await db.scrapeJob.update({
            where: { id: scrapeJob.id },
            data: {
              status: ScrapeStatus.FAILED,
              errorMessage:
                error instanceof Error ? error.message : "Unknown TinyFish failure",
            },
          });
        }
      }),
    );
  },
  {
    connection: redis,
  },
);
