import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

function confidenceScore(
  sourcePlatform: string,
  description: string,
  rawData: unknown,
) {
  let score = 0.3;
  if (["timeout", "the-infatuation", "google-maps"].includes(sourcePlatform)) score += 0.3;
  if (description.length > 80) score += 0.2;
  const payload = JSON.stringify(rawData).toLowerCase();
  if (payload.includes("address")) score += 0.2;
  if (payload.includes("hours")) score += 0.2;
  if (payload.includes("likes") || payload.includes("views") || payload.includes("score")) score += 0.1;
  return Math.min(score, 1);
}

new Worker(
  "normalize-knowledge",
  async (job) => {
    const { tripId, scrapeJobId } = job.data as {
      tripId: string;
      scrapeJobId?: string;
    };

    const entries = await db.knowledgeEntry.findMany({
      where: {
        tripId,
        ...(scrapeJobId ? { scrapeJobId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    const seenByUrl = new Map<string, string>();
    const seenByTitle = new Map<string, string>();

    for (const entry of entries) {
      const urlKey = `${entry.title.toLowerCase()}::${entry.sourceUrl.toLowerCase()}`;
      const titleKey = entry.title.toLowerCase().trim();

      if (seenByUrl.has(urlKey) || seenByTitle.has(titleKey)) {
        await db.knowledgeEntry.delete({
          where: { id: entry.id },
        });
        continue;
      }

      seenByUrl.set(urlKey, entry.id);
      seenByTitle.set(titleKey, entry.id);

      await db.knowledgeEntry.update({
        where: { id: entry.id },
        data: {
          confidence: confidenceScore(
            entry.sourcePlatform,
            entry.description,
            entry.rawData,
          ),
        },
      });
    }
  },
  {
    connection: redis,
  },
);
