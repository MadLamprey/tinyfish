import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export async function requireSessionUser() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(error: unknown) {
  return NextResponse.json(
    {
      error: "Bad request",
      details: error instanceof Error ? error.message : "Invalid input",
    },
    { status: 400 },
  );
}

export function serverError() {
  return NextResponse.json(
    { error: "Something went wrong. We're still researching..." },
    { status: 500 },
  );
}

export function isOpenClawAuthorized(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${env.OPENCLAW_WEBHOOK_SECRET}`;
}
