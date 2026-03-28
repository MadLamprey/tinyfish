import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: {
    reason: string;
    status: string;
    knowledgeEntry: { title: string; category: string; sourcePlatform: string };
  };
}) {
  return (
    <Card className="grid gap-4 transition duration-200 hover:border-[var(--accent)]/28">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{recommendation.knowledgeEntry.title}</h3>
        <Badge>{recommendation.status}</Badge>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">{recommendation.reason}</p>
      <div className="flex flex-wrap gap-2">
        <Badge className="text-[var(--accent)]">{recommendation.knowledgeEntry.category}</Badge>
        <Badge>{recommendation.knowledgeEntry.sourcePlatform}</Badge>
      </div>
    </Card>
  );
}
