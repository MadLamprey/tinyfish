import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { tripSchema } from "@/lib/validations";

export async function GET() {
  try {
    const trips = await db.trip.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            knowledgeEntries: true,
          },
        },
      },
    });

    return NextResponse.json(trips);
  } catch {
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const body = tripSchema.parse(await request.json());
    const fallbackUser =
      (await db.user.findFirst({ orderBy: { createdAt: "asc" } })) ??
      (await db.user.create({
        data: {
          email: "demo@travel.test",
          name: "Demo Traveler",
        },
      }));

    const trip = await db.trip.create({
      data: {
        userId: fallbackUser.id,
        title: body.title,
        destinationCities: body.destinationCities,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        travelerCount: body.travelerCount,
        vibes: body.vibes,
        timezone: body.timezone,
        telegramChatId: body.telegramChatId,
        telegramChatTitle: body.telegramChatTitle,
      },
    });

    if (body.telegramChatId) {
      await db.telegramSync.create({
        data: {
          tripId: trip.id,
          chatId: body.telegramChatId,
        },
      });
    }

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error);
    }
    return serverError();
  }
}
