"use client";

import { useEffect, useState } from "react";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";

type Entry = {
  id: string;
  title: string;
  category: string;
  sourcePlatform: string;
  tags: string[];
  description: string;
};

export function LiveDiscoveries({
  tripId,
  initialEntries,
}: {
  tripId: string;
  initialEntries: Entry[];
}) {
  const [entries, setEntries] = useState(initialEntries);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/knowledge`);
        const data = (await res.json()) as Entry[];
        setEntries(data.slice(0, 12));
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tripId]);

  if (!entries.length) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        No discoveries yet — chat to start researching.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {entries.map((entry) => (
        <KnowledgeCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
