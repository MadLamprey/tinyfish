import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function KnowledgeCard({
  entry,
}: {
  entry: {
    title: string;
    category: string;
    sourcePlatform: string;
    tags: string[];
    description: string;
  };
}) {
  return (
    <Card className="grid gap-4 transition duration-200 hover:border-[var(--brand-400)]/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{entry.title}</h3>
        <Badge>{entry.sourcePlatform}</Badge>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">{entry.description}</p>
      <div className="flex flex-wrap gap-2">
        <Badge className="text-[var(--brand-300)]">{entry.category}</Badge>
        {entry.tags.slice(0, 3).map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </Card>
  );
}
