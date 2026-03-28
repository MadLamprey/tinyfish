import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverError } from "@/lib/http";

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } },
) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

    const entries = await db.knowledgeEntry.findMany({
      where: {
        tripId: params.tripId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { hasSome: q.split(/\s+/).filter(Boolean) } },
        ],
      },
      take: 20,
      orderBy: { confidence: "desc" },
    });

    return NextResponse.json(entries);
  } catch {
    return serverError();
  }
}
