import Link from "next/link";
import { Compass, Plus, Route } from "lucide-react";
import { db } from "@/lib/db";
import { TripCard } from "@/components/trips/TripCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const trips = await db.trip.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          knowledgeEntries: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-400)]">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Trips in motion</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            Manage shared trip workspaces, keep an eye on Telegram-linked planning groups, and jump back into active research threads.
          </p>
        </div>
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <p className="text-3xl font-semibold">{trips.length}</p>
              <p className="text-sm text-[var(--muted-foreground)]">tracked trips</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">
                {trips.filter((trip) => trip.telegramChatId).length}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">Telegram-linked</p>
            </div>
          </div>
          <Link href="/trips/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create new trip
            </Button>
          </Link>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>
          <Compass className="mr-1 h-3 w-3" />
          Research-first planning
        </Badge>
        <Badge>
          <Route className="mr-1 h-3 w-3" />
          Time-aware itinerary engine
        </Badge>
      </div>
      {trips.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <Card className="grid place-items-center gap-3 p-10 text-center">
          <p className="text-xl font-semibold">No trips yet</p>
          <p className="max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
            Start with a destination and a vibe, then invite the planner to research while your group keeps chatting.
          </p>
          <Link href="/trips/new">
            <Button>Create your first trip</Button>
          </Link>
        </Card>
      )}
    </main>
  );
}
