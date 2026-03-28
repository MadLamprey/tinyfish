import Link from "next/link";
import { ArrowUpRight, MapPinned, MessageCircleMore } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function TripCard({
  trip,
}: {
  trip: {
    id: string;
    title: string;
    destinationCities: string[];
    startDate: Date;
    endDate: Date;
    status: string;
    telegramChatId: string | null;
    _count?: { knowledgeEntries: number };
  };
}) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="group grid gap-5 overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-[var(--brand-400)]/35">
        <div className="absolute inset-x-0 top-0 h-24 rounded-t-[30px] bg-[linear-gradient(135deg,rgba(87,198,255,0.18),rgba(255,198,122,0.08)_55%,transparent)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{trip.title}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <MapPinned className="h-4 w-4 text-[var(--brand-300)]" />
              {trip.destinationCities.join(" · ")}
            </p>
          </div>
          <Badge>{trip.status}</Badge>
        </div>
        <p className="relative text-sm text-[var(--muted-foreground)]">
          {format(trip.startDate, "MMM d")} - {format(trip.endDate, "MMM d, yyyy")}
        </p>
        <div className="relative flex flex-wrap gap-2">
          <Badge>{trip._count?.knowledgeEntries ?? 0} discoveries</Badge>
          {trip.telegramChatId ? (
            <Badge>
              <MessageCircleMore className="mr-1 h-3 w-3" />
              Telegram linked
            </Badge>
          ) : null}
        </div>
        <div className="relative flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <span>Open workspace</span>
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Card>
    </Link>
  );
}
