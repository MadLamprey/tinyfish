import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { tripUpdateSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const trip = await db.trip.findUnique({
      where: { id: params.tripId },
      include: {
        _count: {
          select: {
            knowledgeEntries: true,
            scrapeJobs: true,
            recommendations: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch {
    return serverError();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const body = tripUpdateSchema.parse(await request.json());
    const trip = await db.trip.update({
      where: { id: params.tripId },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.destinationCities ? { destinationCities: body.destinationCities } : {}),
        ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
        ...(body.endDate ? { endDate: new Date(body.endDate) } : {}),
        ...(body.travelerCount ? { travelerCount: body.travelerCount } : {}),
        ...(body.vibes ? { vibes: body.vibes } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
        ...(body.telegramChatId !== undefined ? { telegramChatId: body.telegramChatId } : {}),
        ...(body.telegramChatTitle !== undefined
          ? { telegramChatTitle: body.telegramChatTitle }
          : {}),
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
    await db.trip.delete({
      where: { id: params.tripId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
