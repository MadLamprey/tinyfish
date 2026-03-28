import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverError } from "@/lib/http";

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } },
) {
  try {
    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const source = request.nextUrl.searchParams.get("source") ?? undefined;

    const entries = await db.knowledgeEntry.findMany({
      where: {
        tripId: params.tripId,
        ...(category ? { category: category as never } : {}),
        ...(source ? { sourcePlatform: source } : {}),
      },
      orderBy: [{ confidence: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(entries);
  } catch {
    return serverError();
  }
}
