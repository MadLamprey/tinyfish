import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processUserMessage } from "@/lib/ai/orchestrator";
import { badRequest, serverError } from "@/lib/http";
import { chatMessageSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const messages = await db.conversationMessage.findMany({
      where: { tripId: params.tripId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch {
    return serverError();
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const body = chatMessageSchema.parse(await request.json());
    const result = await processUserMessage(params.tripId, body.message, {
      source: "web",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error);
    }
    return serverError();
  }
}
