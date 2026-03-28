import { NextRequest, NextResponse } from "next/server";
import { RecommendationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  isOpenClawAuthorized,
  serverError,
  unauthorized,
} from "@/lib/http";

const windows = {
  morning: [6, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  night: [21, 24],
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } },
) {
  if (!isOpenClawAuthorized(request)) {
    return unauthorized();
  }

  try {
    const timeOfDay =
      (request.nextUrl.searchParams.get("timeOfDay") as keyof typeof windows | null) ??
      "evening";
    const [startHour, endHour] = windows[timeOfDay] ?? windows.evening;

    const recommendations = await db.recommendation.findMany({
      where: {
        tripId: params.tripId,
        status: RecommendationStatus.PENDING,
      },
      include: {
        knowledgeEntry: true,
        trip: true,
      },
      orderBy: { recommendedFor: "asc" },
    });

    const scoped = recommendations.filter((recommendation) => {
      const hour = recommendation.recommendedFor.getUTCHours();
      return hour >= startHour && hour < endHour;
    });

    const city = scoped[0]?.trip.destinationCities[0] ?? "the city";
    const formatted = `Here's what we found for this ${timeOfDay} in ${city}:\n${scoped
      .map(
        (recommendation, index) =>
          `${index + 1}. ${recommendation.knowledgeEntry.title} (${recommendation.knowledgeEntry.category}) - ${recommendation.reason} (via ${recommendation.knowledgeEntry.sourcePlatform})`,
      )
      .join("\n")}`;

    if (scoped.length) {
      await db.recommendation.updateMany({
        where: {
          id: {
            in: scoped.map((recommendation) => recommendation.id),
          },
        },
        data: {
          status: RecommendationStatus.SHOWN,
        },
      });
    }

    return NextResponse.json({ recommendations: formatted });
  } catch {
    return serverError();
  }
}
