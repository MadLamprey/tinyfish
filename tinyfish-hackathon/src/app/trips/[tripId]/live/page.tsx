import { notFound } from "next/navigation";
import { LiveCardStack } from "@/components/recommendations/LiveCardStack";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LiveTripPage({
  params,
}: {
  params: { tripId: string };
}) {
  const trip = await db.trip.findUnique({
    where: { id: params.tripId },
    include: {
      recommendations: {
        include: { knowledgeEntry: true },
        orderBy: { recommendedFor: "desc" },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl gap-6 px-6 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-400)]">
          Trip mode
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Today&apos;s recommendations</h1>
      </div>
      <Card className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted-foreground)]">
          Last synced from Telegram {trip.telegramChatId ? "recently" : "not linked"}
        </span>
        <Badge>{trip.status}</Badge>
      </Card>
      <LiveCardStack recommendations={trip.recommendations} />
    </main>
  );
}
