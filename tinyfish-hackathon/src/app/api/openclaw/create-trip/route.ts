import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  badRequest,
  isOpenClawAuthorized,
  serverError,
  unauthorized,
} from "@/lib/http";
import { openClawCreateTripSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  if (!isOpenClawAuthorized(request)) {
    return unauthorized();
  }

  try {
    const body = openClawCreateTripSchema.parse(await request.json());
    let user = await db.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: body.userId,
          email: `${body.userId}@telegram.local`,
          name: body.chatTitle,
        },
      });
    }

    const trip = await db.trip.create({
      data: {
        userId: user.id,
        title: `${body.destinations.join(" / ")} Group Trip`,
        destinationCities: body.destinations,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        travelerCount: body.travelerCount,
        vibes: body.vibes,
        timezone: "UTC",
        telegramChatId: body.chatId,
        telegramChatTitle: body.chatTitle,
      },
    });

    await db.telegramSync.create({
      data: {
        tripId: trip.id,
        chatId: body.chatId,
      },
    });

    return NextResponse.json({
      tripId: trip.id,
      message: `Trip created! I'll start researching ${body.destinations.join(", ")}.`,
    });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error);
    }
    return serverError();
  }
}
