import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { telegramLinkSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const body = telegramLinkSchema.parse(await request.json());

    const trip = await db.trip.update({
      where: { id: params.tripId },
      data: {
        telegramChatId: body.telegramChatId,
        telegramChatTitle: body.telegramChatTitle,
      },
    });

    await db.telegramSync.upsert({
      where: { tripId: params.tripId },
      update: {
        chatId: body.telegramChatId,
        isActive: true,
      },
      create: {
        tripId: params.tripId,
        chatId: body.telegramChatId,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error);
    }
    return serverError();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    await db.trip.update({
      where: { id: params.tripId },
      data: {
        telegramChatId: null,
        telegramChatTitle: null,
      },
    });

    await db.telegramSync.deleteMany({
      where: { tripId: params.tripId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
