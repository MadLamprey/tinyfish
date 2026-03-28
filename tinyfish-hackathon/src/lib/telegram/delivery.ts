import { db } from "@/lib/db";
import { env } from "@/lib/env";

function escapeMarkdown(value: string) {
  return value.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

export async function sendTelegramRecommendations(
  tripId: string,
  recommendationIds: string[],
  timeOfDay: string,
) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      recommendations: {
        where: {
          id: {
            in: recommendationIds,
          },
        },
        include: {
          knowledgeEntry: true,
        },
      },
    },
  });

  if (!trip?.telegramChatId) {
    return;
  }

  const city = trip.destinationCities[0] ?? "your destination";
  const body = trip.recommendations
    .map((recommendation, index) => {
      const location = recommendation.knowledgeEntry.location as
        | { address?: string }
        | null;

      return [
        `*${index + 1}. ${escapeMarkdown(recommendation.knowledgeEntry.title)}* (${recommendation.knowledgeEntry.category})`,
        escapeMarkdown(recommendation.reason),
        `📍 ${escapeMarkdown(location?.address ?? "Address not available")}`,
        `🔗 Source: ${escapeMarkdown(recommendation.knowledgeEntry.sourcePlatform)}`,
      ].join("\n");
    })
    .join("\n\n");

  const text = `🗺 *Good ${escapeMarkdown(timeOfDay)} in ${escapeMarkdown(city)}!*\n\nHere's what we found for you:\n\n${body}`;

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: trip.telegramChatId,
        text,
        parse_mode: "MarkdownV2",
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await db.telegramSync.updateMany({
        where: { tripId },
        data: { isActive: false },
      });
    }
    throw new Error(`Telegram delivery failed: ${response.status}`);
  }

  await db.recommendation.updateMany({
    where: {
      id: {
        in: recommendationIds,
      },
    },
    data: {
      deliveredTo: ["web", "telegram"],
    },
  });
}
