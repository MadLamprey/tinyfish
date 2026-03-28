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
      include: {
        _count: { select: { knowledgeEntries: true } },
      },
    });

    return NextResponse.json(
      jobs.map((j) => ({
        id: j.id,
        platform: j.platform,
        status: j.status,
        completedAt: j.completedAt,
        errorMessage: j.errorMessage,
        entryCount: j._count.knowledgeEntries,
      })),
    );
  } catch {
    return serverError();
  }
}
