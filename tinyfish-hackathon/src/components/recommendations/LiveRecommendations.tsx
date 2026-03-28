"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Rec = {
  id: string;
  reason: string;
  status: string;
  knowledgeEntry: { title: string; category: string; sourcePlatform: string };
};

export function LiveRecommendations({
  tripId,
  initialRecommendations,
}: {
  tripId: string;
  initialRecommendations: Rec[];
}) {
  const [recs, setRecs] = useState(initialRecommendations);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/recommendations`);
        const data = (await res.json()) as Rec[];
        setRecs(data);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tripId]);

  async function handleStatus(recId: string, status: "ACCEPTED" | "DISMISSED") {
    await fetch(`/api/trips/${tripId}/recommendations/${recId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRecs((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status } : r)),
    );
  }

  if (!recs.length) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        No itinerary moments yet — keep chatting to generate recommendations.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {recs.map((rec) => (
        <Card
          key={rec.id}
          className="grid gap-4 transition duration-200 hover:border-[var(--accent)]/28"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">
              {rec.knowledgeEntry.title}
            </h3>
            <Badge
              className={
                rec.status === "ACCEPTED"
                  ? "text-[var(--accent)]"
                  : rec.status === "DISMISSED"
                    ? "opacity-50"
                    : ""
              }
            >
              {rec.status}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">{rec.reason}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge className="text-[var(--accent)]">
                {rec.knowledgeEntry.category}
              </Badge>
              <Badge>{rec.knowledgeEntry.sourcePlatform}</Badge>
            </div>
            {rec.status === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  className="px-3 py-1.5 text-xs"
                  onClick={() => handleStatus(rec.id, "ACCEPTED")}
                >
                  Add to trip
                </Button>
                <Button
                  className="px-3 py-1.5 text-xs"
                  variant="secondary"
                  onClick={() => handleStatus(rec.id, "DISMISSED")}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
