import { PlaceCategory, RecommendationStatus, TripStatus } from "@prisma/client";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { telegramDeliveryQueue } from "@/lib/queue";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

function categoriesForHour(hour: number): PlaceCategory[] {
  if (hour >= 6 && hour < 10) {
    return [PlaceCategory.CAFE, PlaceCategory.RESTAURANT, PlaceCategory.EVENT];
  }
  if (hour >= 10 && hour < 14) {
    return [
      PlaceCategory.ACTIVITY,
      PlaceCategory.ATTRACTION,
      PlaceCategory.SHOPPING,
      PlaceCategory.EVENT,
    ];
  }
  if (hour >= 14 && hour < 18) {
    return [
      PlaceCategory.ACTIVITY,
      PlaceCategory.ATTRACTION,
      PlaceCategory.SHOPPING,
      PlaceCategory.CAFE,
      PlaceCategory.EVENT,
    ];
  }
  if (hour >= 18 && hour < 21) {
    return [PlaceCategory.RESTAURANT, PlaceCategory.EVENT];
  }
  return [PlaceCategory.BAR, PlaceCategory.CLUB, PlaceCategory.EVENT];
}

function inferTimeOfDay(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export async function generateRecommendationsForTrip(tripId: string) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      knowledgeEntries: {
        where: {
          confidence: {
            gte: 0.5,
          },
        },
        orderBy: [{ confidence: "desc" }, { updatedAt: "desc" }],
        take: 30,
      },
      recommendations: {
        where: {
          status: {
            in: [RecommendationStatus.ACCEPTED, RecommendationStatus.DISMISSED],
          },
        },
        take: 15,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!trip || trip.status !== TripStatus.ACTIVE) {
    return [];
  }

  const now = new Date();
  const localHour = Number.parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: trip.timezone,
    }).format(now),
    10,
  );
  const categories = categoriesForHour(localHour);
  const candidates = trip.knowledgeEntries.filter((entry) =>
    categories.includes(entry.category),
  );

  if (!candidates.length) {
    return [];
  }

  const rankingPrompt = `Rank the best 5 recommendations for this trip right now.

Trip vibes:
${trip.vibes.join(", ")}

Previously acted on recommendations:
${trip.recommendations.map((rec) => rec.reason).join("\n") || "None"}

Candidates:
${candidates
  .map(
    (entry) =>
      `${entry.id} | ${entry.title} | ${entry.category} | ${entry.sourcePlatform} | confidence=${entry.confidence} | tags=${entry.tags.join(", ")} | description=${entry.description}`,
  )
  .join("\n")}

Return JSON only:
{
  "recommendations": [
    { "knowledgeEntryId": "id", "reason": "why it fits now" }
  ]
}`;

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    input: rankingPrompt,
  });

  const rawText = response.output_text;
  let parsed: { recommendations?: Array<{ knowledgeEntryId: string; reason: string }> };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error("Recommender: failed to parse LLM response", rawText);
    return [];
  }

  const created = await Promise.all(
    (parsed.recommendations ?? []).slice(0, 5).map((item) =>
      db.recommendation.create({
        data: {
          tripId,
          knowledgeEntryId: item.knowledgeEntryId,
          recommendedFor: now,
          reason: item.reason,
          deliveredTo: ["web"],
        },
      }),
    ),
  );

  if (trip.telegramChatId && created.length) {
    await telegramDeliveryQueue.add("deliver-to-telegram", {
      tripId,
      recommendationIds: created.map((item) => item.id),
      timeOfDay: inferTimeOfDay(localHour),
    });
  }

  return created;
}
