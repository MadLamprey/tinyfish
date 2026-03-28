import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverError } from "@/lib/http";

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    const messages = await db.conversationMessage.findMany({
      where: {
        tripId: params.tripId,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch {
    return serverError();
  }
}
