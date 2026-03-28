import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const recommendations = await db.recommendation.findMany({
      where: { tripId: params.tripId },
      include: { knowledgeEntry: true },
      orderBy: { recommendedFor: "asc" },
    });

    return NextResponse.json(recommendations);
  } catch {
    return serverError();
  }
}
