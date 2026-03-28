import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const jobs = await db.scrapeJob.findMany({
      where: { tripId: params.tripId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch {
    return serverError();
  }
}
