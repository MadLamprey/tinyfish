import { Card } from "@/components/ui/card";

export function KnowledgeDetail({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="grid gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
    </Card>
  );
}
