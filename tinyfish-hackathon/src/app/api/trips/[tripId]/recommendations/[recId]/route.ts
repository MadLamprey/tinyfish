import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { recommendationStatusSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; recId: string } },
) {
  try {
    const body = recommendationStatusSchema.parse(await request.json());
    await db.recommendation.updateMany({
      where: { id: params.recId, tripId: params.tripId },
      data: { status: body.status },
    });

    const recommendation = await db.recommendation.findUnique({
      where: { id: params.recId },
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error);
    }
    return serverError();
  }
}
