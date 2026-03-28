import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  badRequest,
  isOpenClawAuthorized,
  serverError,
  unauthorized,
} from "@/lib/http";
import { processUserMessage } from "@/lib/ai/orchestrator";
import {
  cacheTelegramReply,
  incrementTelegramSyncRateLimit,
  shouldUseCachedTelegramReply,
  synthesizeTelegramMessages,
} from "@/lib/telegram/messageBatcher";
import { openClawSyncSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  if (!isOpenClawAuthorized(request)) {
    return unauthorized();
  }

  try {
    const body = openClawSyncSchema.parse(await request.json());
    const trip = await db.trip.findUnique({
      where: { id: body.tripId },
    });

    if (!trip?.telegramChatId) {
      return NextResponse.json({ error: "Trip not linked to Telegram" }, { status: 404 });
    }

    console.info("OpenClaw sync-chat", {
      tripId: body.tripId,
      at: new Date().toISOString(),
    });

    const existingIds = (
      await db.conversationMessage.findMany({
        where: {
          tripId: body.tripId,
          telegramMessageId: {
            in: body.messages
              .map((message) => message.telegramMessageId)
              .filter((value): value is number => typeof value === "number"),
          },
        },
        select: { telegramMessageId: true },
      })
    )
      .map((message) => message.telegramMessageId)
      .filter((value): value is number => typeof value === "number");

    const newMessages = body.messages.filter(
      (message) =>
        message.telegramMessageId === undefined ||
        !existingIds.includes(message.telegramMessageId),
    );

    if (!newMessages.length) {
      const cached = await shouldUseCachedTelegramReply(body.tripId, "");
      return NextResponse.json({ reply: cached?.reply ?? "Still researching! Check back soon." });
    }

    const rateCount = await incrementTelegramSyncRateLimit(body.tripId);
    if (rateCount > 10) {
      return NextResponse.json({ reply: "Still researching! Check back soon." });
    }

    for (const message of newMessages) {
      await db.conversationMessage.create({
        data: {
          tripId: body.tripId,
          role: "USER",
          content: message.text,
          source: "TELEGRAM",
          senderName: message.senderName,
          telegramMessageId: message.telegramMessageId,
          metadata: {
            timestamp: message.timestamp,
          },
        },
      });
    }

    const synthesized = synthesizeTelegramMessages(newMessages);
    const cached = await shouldUseCachedTelegramReply(body.tripId, synthesized);

    if (cached) {
      return NextResponse.json({ reply: cached.reply });
    }

    const result = await processUserMessage(body.tripId, synthesized, {
      source: "telegram",
      senderName: "group",
    });

    await cacheTelegramReply(body.tripId, result.assistantReply);

    await db.telegramSync.updateMany({
      where: { tripId: body.tripId },
      data: {
        lastProcessedAt: new Date(),
        lastMessageId:
          newMessages
            .map((message) => message.telegramMessageId ?? 0)
            .sort((left, right) => right - left)[0] ?? 0,
      },
    });

    return NextResponse.json({ reply: result.assistantReply });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error);
    }
    return serverError();
  }
}
