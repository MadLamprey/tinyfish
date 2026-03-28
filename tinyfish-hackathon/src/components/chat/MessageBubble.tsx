import { Globe2, MessageCircleMore } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Props = {
  role: "USER" | "ASSISTANT";
  content: string;
  source: "WEB" | "TELEGRAM";
  senderName?: string | null;
};

export function MessageBubble({ role, content, source, senderName }: Props) {
  return (
    <Card
      className={
        role === "USER"
          ? "ml-auto max-w-xl border-[var(--brand-400)]/25 bg-[linear-gradient(180deg,rgba(16,148,214,0.18),rgba(16,148,214,0.08))]"
          : "max-w-xl bg-[var(--card-strong)]"
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge className="text-[10px]">
          {source === "TELEGRAM" ? <MessageCircleMore className="mr-1 h-3 w-3" /> : <Globe2 className="mr-1 h-3 w-3" />}
          {source === "TELEGRAM" ? "Telegram" : "Web"}
        </Badge>
        {senderName ? (
          <span className="text-xs font-medium text-[var(--brand-300)]">{senderName}</span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7">{content}</p>
    </Card>
  );
}
