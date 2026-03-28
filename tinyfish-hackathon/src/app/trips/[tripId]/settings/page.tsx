import { notFound } from "next/navigation";
import { TelegramLinkPanel } from "@/components/telegram/TelegramLinkPanel";
import { TelegramSyncStatus } from "@/components/telegram/TelegramSyncStatus";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TripSettingsPage({
  params,
}: {
  params: { tripId: string };
}) {
  const trip = await db.trip.findUnique({
    where: { id: params.tripId },
  });

  const sync = await db.telegramSync.findUnique({
    where: { tripId: params.tripId },
  });

  if (!trip) {
    notFound();
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl gap-6 px-6 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-400)]">
          Settings
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{trip.title}</h1>
      </div>
      <Card>
        <p className="text-sm text-[var(--muted-foreground)]">
          Edit trip details through the API today; this page focuses on Telegram linking and sync visibility.
        </p>
      </Card>
      <TelegramSyncStatus
        lastProcessedAt={sync?.lastProcessedAt}
        isActive={sync?.isActive}
      />
      <TelegramLinkPanel
        tripId={trip.id}
        initialChatId={trip.telegramChatId}
        initialChatTitle={trip.telegramChatTitle}
      />
    </main>
  );
}
