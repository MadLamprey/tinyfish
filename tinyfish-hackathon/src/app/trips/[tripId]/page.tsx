import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarRange, Compass, MessageCircleMore, Sparkles } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { KnowledgeGrid } from "@/components/knowledge/KnowledgeGrid";
import { RecommendationTimeline } from "@/components/recommendations/RecommendationTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
}: {
  params: { tripId: string };
}) {
  const trip = await db.trip.findUnique({
    where: { id: params.tripId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      knowledgeEntries: {
        orderBy: { updatedAt: "desc" },
        take: 12,
      },
      recommendations: {
        include: {
          knowledgeEntry: true,
        },
        orderBy: { recommendedFor: "asc" },
      },
      scrapeJobs: {
        where: { status: "RUNNING" },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-10">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[38px] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(10,23,43,0.95),rgba(8,17,31,0.86))] p-8 shadow-[0_40px_120px_rgba(4,10,26,0.45)]">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(87,198,255,0.2),transparent_70%)]" />
          <div className="relative">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-400)]">
            Trip workspace
          </p>
            <h1 className="mt-2 text-4xl font-semibold">{trip.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              Use the chat to shape the trip, watch discoveries arrive from background research, and turn the best ones into a live itinerary.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>{trip.status}</Badge>
              <Badge>
                <CalendarRange className="mr-1 h-3 w-3" />
                {trip.destinationCities.join(" · ")}
              </Badge>
              {trip.telegramChatId ? (
                <Badge className="text-[var(--brand-100)]">
                  <MessageCircleMore className="mr-1 h-3 w-3" />
                  Telegram linked
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <Card className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Workspace controls
            </p>
            <Sparkles className="h-4 w-4 text-[var(--brand-300)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-2xl font-semibold">{trip.messages.length}</p>
              <p className="text-sm text-[var(--muted-foreground)]">messages captured</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-2xl font-semibold">{trip.knowledgeEntries.length}</p>
              <p className="text-sm text-[var(--muted-foreground)]">latest discoveries shown</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-2xl font-semibold">{trip.recommendations.length}</p>
              <p className="text-sm text-[var(--muted-foreground)]">itinerary moments</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/trips/${trip.id}/live`}>
              <Button variant="secondary">Live view</Button>
            </Link>
            <Link href={`/trips/${trip.id}/settings`}>
              <Button>Settings</Button>
            </Link>
          </div>
        </Card>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <ChatWindow
            tripId={trip.id}
            runningJobs={trip.scrapeJobs.length}
            initialMessages={trip.messages.map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              source: message.source,
              senderName: message.senderName,
            }))}
          />
        </div>
        <div className="grid gap-6">
          <Card className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Discoveries</h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Fresh research signals from TinyFish across social, editorial, and maps.
                </p>
              </div>
              <Compass className="h-5 w-5 text-[var(--brand-300)]" />
            </div>
            <KnowledgeGrid
              entries={trip.knowledgeEntries.map((entry) => ({
                id: entry.id,
                title: entry.title,
                category: entry.category,
                sourcePlatform: entry.sourcePlatform,
                tags: entry.tags,
                description: entry.description,
              }))}
            />
          </Card>
          <Card className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Itinerary</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Ranked moments ready to be accepted, dismissed, or turned into trip mode cards.
              </p>
            </div>
            <RecommendationTimeline recommendations={trip.recommendations} />
          </Card>
        </div>
      </section>
    </main>
  );
}
