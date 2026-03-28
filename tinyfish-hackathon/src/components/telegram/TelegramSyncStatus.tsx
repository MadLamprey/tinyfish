import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function TelegramSyncStatus({
  lastProcessedAt,
  isActive,
}: {
  lastProcessedAt?: Date | null;
  isActive?: boolean;
}) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Telegram sync</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {lastProcessedAt
            ? `Last synced ${lastProcessedAt.toLocaleString()}`
            : "No Telegram sync yet"}
        </p>
      </div>
      <Badge>{isActive ? "Active" : "Inactive"}</Badge>
    </Card>
  );
}
