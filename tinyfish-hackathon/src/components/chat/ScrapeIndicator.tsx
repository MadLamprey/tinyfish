import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ScrapeJob = {
  id: string;
  platform: string;
  status: string;
  entryCount: number;
};

export function ScrapeIndicator({ jobs }: { jobs: ScrapeJob[] }) {
  if (!jobs.length) return null;

  const running = jobs.filter((j) => j.status === "RUNNING");
  const completed = jobs.filter((j) => j.status === "COMPLETED");
  const failed = jobs.filter((j) => j.status === "FAILED");

  return (
    <div className="flex flex-wrap gap-2">
      {running.map((job) => (
        <Badge
          key={job.id}
          className="gap-1.5 border-[var(--brand-400)]/30 bg-[var(--brand-500)]/10 text-[var(--brand-100)]"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          {job.platform}
        </Badge>
      ))}
      {completed.map((job) => (
        <Badge
          key={job.id}
          className="gap-1.5 border-green-500/30 bg-green-500/10 text-green-300"
        >
          <CheckCircle2 className="h-3 w-3" />
          {job.platform} · {job.entryCount} found
        </Badge>
      ))}
      {failed.map((job) => (
        <Badge
          key={job.id}
          className="gap-1.5 border-red-500/30 bg-red-500/10 text-red-300"
        >
          <XCircle className="h-3 w-3" />
          {job.platform} failed
        </Badge>
      ))}
    </div>
  );
}
