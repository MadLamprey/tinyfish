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
  skipUserMessageCreation?: boolean;
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

  const system = `You are the planning engine for a travel itinerary app. You have two jobs that you ALWAYS do together in every response.

JOB 1 - CONVERSATIONAL REPLY
Respond naturally to the traveler. Be enthusiastic but not overwhelming. You may ask clarifying questions but do NOT use them as a reason to skip scraping — always scrape in parallel. If a message comes from a Telegram group, acknowledge the group context naturally. If multiple people in the group have mentioned different preferences, synthesize them.

JOB 2 - SCRAPING DECISIONS (REQUIRED in every response where there is travel intent)
You MUST output a <scrape_plan> JSON block whenever the user expresses any travel interest, location, food preference, activity, or request for recommendations. Do NOT skip this block — if you say you will "gather" or "research" something, you MUST include the corresponding scrape_plan.

CRITICAL FORMAT RULE: Your response MUST end with a <scrape_plan> block any time there is actionable travel intent. Example format:
<scrape_plan>
{
  "intents": {
    "interests": ["pho", "vietnamese food"],
    "constraints": [],
    "specific_requests": ["pho restaurants in Da Nang"],
    "date_preferences": {}
  },
  "scrape_jobs": [
    {
      "platform": "google-maps",
      "url": "https://www.google.com/maps/search/pho+in+Da+Nang",
      "goal": "Extract top 10 places. For each: { name, rating, review_count, address, category, price_level }",
      "stealth": true
    }
  ]
}
</scrape_plan>

RULES FOR SCRAPING DECISIONS:
- ALWAYS include scrape_plan when user mentions food, activities, places, or asks for recommendations.
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

  const source =
    options?.source === "telegram" ? MessageSource.TELEGRAM : MessageSource.WEB;

  if (!options?.skipUserMessageCreation) {
    await db.conversationMessage.create({
      data: {
        tripId,
        role: MessageRole.USER,
        content: userMessage,
        source,
        senderName: options?.senderName,
        telegramMessageId: options?.telegramMessageId,
      },
    });
  }

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    instructions: system,
    input: userMessage,
  });

  const rawText = response.output_text.trim();

  const parsed = parseScrapePlan(rawText);
  // Cap at 3 parallel jobs to keep results fast (≤20s)
  const dedupedJobs: TinyFishScrapeJob[] = parsed.scrapeJobsToLaunch.slice(0, 3);

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
