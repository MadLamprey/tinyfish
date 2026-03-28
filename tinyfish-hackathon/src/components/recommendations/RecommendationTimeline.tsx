import { RecommendationCard } from "@/components/recommendations/RecommendationCard";

export function RecommendationTimeline({
  recommendations,
}: {
  recommendations: Array<{
    id: string;
    reason: string;
    status: string;
    knowledgeEntry: { title: string; category: string; sourcePlatform: string };
  }>;
}) {
  return (
    <div className="grid gap-4">
      {recommendations.map((recommendation) => (
        <RecommendationCard key={recommendation.id} recommendation={recommendation} />
      ))}
    </div>
  );
}
