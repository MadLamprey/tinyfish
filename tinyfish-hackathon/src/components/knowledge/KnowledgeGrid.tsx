import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";

export function KnowledgeGrid({
  entries,
}: {
  entries: Array<{
    id: string;
    title: string;
    category: string;
    sourcePlatform: string;
    tags: string[];
    description: string;
  }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {entries.map((entry) => (
        <KnowledgeCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
