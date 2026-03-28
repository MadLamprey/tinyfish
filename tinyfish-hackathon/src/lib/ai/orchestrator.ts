import { MessageSource, MessageRole } from "@prisma/client";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { batchScrapeQueue } from "@/lib/queue";
import { platformStrategyPrompt } from "@/lib/ai/prompts";
import type {
  ExtractedIntents,
  OrchestratorResult,
  TinyFishScrapeJob,
} from "@/types";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

type ProcessOptions = {
  source?: "web" | "telegram";
  senderName?: string;
  telegramMessageId?: number;
};

function summarizeKnowledge(
  entries: Array<{ title: string; sourcePlatform: string; tags: string[] }>,
) {
  if (!entries.length) {
    return "No knowledge entries yet.";
  }

  return entries
    .slice(0, 20)
    .map(
      (entry) =>
        `${entry.title} via ${entry.sourcePlatform} [${entry.tags.join(", ")}]`,
    )
    .join("\n");
}

function buildTripContext(trip: {
  title: string;
  destinationCities: string[];
  startDate: Date;
  endDate: Date;
  travelerCount: number;
  vibes: string[];
  timezone: string;
  status: string;
  telegramChatTitle: string | null;
}) {
  return JSON.stringify(
    {
      title: trip.title,
      destinationCities: trip.destinationCities,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      travelerCount: trip.travelerCount,
      vibes: trip.vibes,
      timezone: trip.timezone,
      status: trip.status,
      telegramChatTitle: trip.telegramChatTitle,
    },
    null,
    2,
  );
}

function parseScrapePlan(rawText: string) {
  const match = rawText.match(/<scrape_plan>([\s\S]*?)<\/scrape_plan>/);
  const assistantReply = rawText
    .replace(/<scrape_plan>[\s\S]*?<\/scrape_plan>/, "")
    .trim();

  if (!match) {
    return {
      assistantReply,
      scrapeJobsToLaunch: [] as TinyFishScrapeJob[],
      extractedIntents: {
        interests: [],
        constraints: [],
        specificRequests: [],
        datePreferences: {},
      } satisfies ExtractedIntents,
    };
  }

  const parsed = JSON.parse(match[1].trim()) as {
    intents?: {
      interests?: string[];
      constraints?: string[];
      specific_requests?: string[];
      date_preferences?: Record<string, string>;
    };
    scrape_jobs?: TinyFishScrapeJob[];
  };

  return {
    assistantReply,
    scrapeJobsToLaunch: parsed.scrape_jobs ?? [],
    extractedIntents: {
      interests: parsed.intents?.interests ?? [],
      constraints: parsed.intents?.constraints ?? [],
      specificRequests: parsed.intents?.specific_requests ?? [],
      datePreferences: parsed.intents?.date_preferences ?? {},
    } satisfies ExtractedIntents,
  };
}

async function hasEnoughKnowledge(tripId: string, job: TinyFishScrapeJob) {
  const keywords = job.goal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3)
    .slice(0, 5);

  const count = await db.knowledgeEntry.count({
    where: {
      tripId,
      sourcePlatform: job.platform,
      confidence: {
        gt: 0.7,
      },
      OR: [
        {
          tags: {
            hasSome: keywords,
          },
        },
        {
          description: {
            contains: keywords[0] ?? "",
            mode: "insensitive",
          },
        },
      ],
    },
  });

  return count > 10;
}

export async function processUserMessage(
  tripId: string,
  userMessage: string,
  options?: ProcessOptions,
): Promise<OrchestratorResult> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      knowledgeEntries: {
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
          title: true,
          sourcePlatform: true,
          tags: true,
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const conversationHistory = trip.messages
    .slice()
    .reverse()
    .map((message) => {
      const sender = message.senderName ? ` (${message.senderName})` : "";
      return `${message.role}${sender}: ${message.content}`;
    })
    .join("\n");

  const system = `You are the planning engine for a travel itinerary app. You have two jobs:

JOB 1 - CONVERSATIONAL REPLY
Respond naturally to the traveler. Be enthusiastic but not overwhelming. Ask clarifying questions when useful. If a message comes from a Telegram group, acknowledge the group context naturally. If multiple people in the group have mentioned different preferences, synthesize them.

JOB 2 - SCRAPING DECISIONS
Based on what the traveler just said, decide which websites to scrape for recommendations. Output a JSON block wrapped in <scrape_plan> tags.

RULES FOR SCRAPING DECISIONS:
- Only scrape when the user has said something that warrants new data.
- Use stealth browser for: Instagram, TikTok, Lemon8, Google Maps, Tripadvisor.
- Use lite browser for: Reddit, TimeOut, The Infatuation, blogs.
- Always request JSON output in the goal with an explicit field schema.
- Prefer multiple parallel small scrapes over one giant scrape.
- Don't re-scrape things you've already scraped.
- If input is from Telegram, it may contain multiple speakers. Extract the union of all travel intents across all messages in the batch.

${platformStrategyPrompt}

TRIP CONTEXT:
${buildTripContext(trip)}

EXISTING KNOWLEDGE SUMMARY:
${summarizeKnowledge(trip.knowledgeEntries)}

CONVERSATION HISTORY:
${conversationHistory || "No previous messages."}
`;

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    instructions: system,
    input: userMessage,
  });

  const rawText = response.output_text.trim();

  const parsed = parseScrapePlan(rawText);
  const dedupedJobs: TinyFishScrapeJob[] = [];

  for (const job of parsed.scrapeJobsToLaunch) {
    const shouldSkip = await hasEnoughKnowledge(tripId, job);
    if (!shouldSkip) {
      dedupedJobs.push(job);
    }
  }

  const source =
    options?.source === "telegram" ? MessageSource.TELEGRAM : MessageSource.WEB;

  await db.conversationMessage.create({
    data: {
      tripId,
      role: MessageRole.USER,
      content: userMessage,
      metadata: parsed.extractedIntents,
      source,
      senderName: options?.senderName,
      telegramMessageId: options?.telegramMessageId,
    },
  });

  await db.conversationMessage.create({
    data: {
      tripId,
      role: MessageRole.ASSISTANT,
      content: parsed.assistantReply,
      metadata: {
        queuedJobs: dedupedJobs.length,
      },
      source,
      senderName: source === MessageSource.TELEGRAM ? "Travel Planner" : undefined,
    },
  });

  if (dedupedJobs.length) {
    await batchScrapeQueue.add("batch-scrape", {
      tripId,
      jobs: dedupedJobs,
    });
  }

  return {
    assistantReply: parsed.assistantReply,
    scrapeJobsToLaunch: dedupedJobs,
    extractedIntents: parsed.extractedIntents,
  };
}
