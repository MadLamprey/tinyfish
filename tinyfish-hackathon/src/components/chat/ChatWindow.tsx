"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ScrapeIndicator } from "@/components/chat/ScrapeIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  source: "WEB" | "TELEGRAM";
  senderName?: string | null;
};

type ScrapeJob = {
  id: string;
  platform: string;
  status: string;
  entryCount: number;
};

export function ChatWindow({
  tripId,
  initialMessages,
}: {
  tripId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [scrapeJobs, setScrapeJobs] = useState<ScrapeJob[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const prevJobStatusesRef = useRef<Record<string, string>>({});

  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => void pollJobs(), 2_000);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function pollJobs() {
    try {
      const res = await fetch(`/api/trips/${tripId}/scrape-jobs`);
      const jobs = (await res.json()) as ScrapeJob[];
      setScrapeJobs(jobs);

      // Detect any job that just finished since last poll
      const prev = prevJobStatusesRef.current;
      const justFinished = jobs.filter(
        (j) =>
          (j.status === "COMPLETED" || j.status === "FAILED") &&
          prev[j.id] === "RUNNING",
      );
      prevJobStatusesRef.current = Object.fromEntries(jobs.map((j) => [j.id, j.status]));

      if (justFinished.length > 0) {
        await fetchNewMessages();
      }

      if (jobs.every((j) => j.status !== "RUNNING")) {
        stopPolling();
      }
    } catch {
      // ignore
    }
  }

  async function fetchNewMessages() {
    try {
      const since = lastMessageTimestampRef.current;
      const url = `/api/trips/${tripId}/messages${since ? `?since=${encodeURIComponent(since)}` : ""}`;
      const res = await fetch(url);
      const newMessages = (await res.json()) as Message[];
      if (newMessages.length > 0) {
        lastMessageTimestampRef.current =
          newMessages[newMessages.length - 1].id;
        setMessages((current) => {
          const existingIds = new Set(current.map((m) => m.id));
          return [...current, ...newMessages.filter((m) => !existingIds.has(m.id))];
        });
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  async function handleSubmit() {
    if (!input.trim()) return;

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      role: "USER",
      content: input,
      source: "WEB",
    };

    setMessages((current) => [...current, optimisticMessage]);
    const nextInput = input;
    setInput("");

    startTransition(async () => {
      const response = await fetch(`/api/trips/${tripId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextInput }),
      });
      const payload = (await response.json()) as {
        assistantReply: string;
        scrapeJobsToLaunch: unknown[];
      };

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: payload.assistantReply,
        source: "WEB",
      };

      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticMessage.id),
        optimisticMessage,
        assistantMessage,
      ]);

      // Record this message's position so polling knows what's "new"
      lastMessageTimestampRef.current = assistantMessage.id;

      if (payload.scrapeJobsToLaunch?.length) {
        // Kick off an immediate poll to populate job list, then keep polling
        await pollJobs();
        startPolling();
      }
    });
  }

  const activeJobs = scrapeJobs.filter(
    (j) => j.status === "RUNNING" || j.status === "COMPLETED" || j.status === "FAILED",
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Trip planning chat</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Web messages and Telegram sync land in one shared planning timeline.
          </p>
        </div>
        <ScrapeIndicator jobs={activeJobs} />
      </div>
      <Card className="grid gap-5 overflow-hidden p-0">
        <div className="border-b border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a7a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--warm)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Planner console
            </span>
          </div>
        </div>
        <div className="grid gap-4 px-6">
          {messages.length ? (
            messages.map((message) => <MessageBubble key={message.id} {...message} />)
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Start the trip conversation here. Telegram group sync will show up in the same thread.
            </p>
          )}
        </div>
        <div className="grid gap-3 border-t border-[var(--line)] bg-black/10 px-6 py-5">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell the planner what kind of trip you want, what to avoid, or what your group is debating..."
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Researching..." : "Send message"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
