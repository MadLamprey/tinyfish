"use client";

import { useState, useTransition } from "react";
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

export function ChatWindow({
  tripId,
  initialMessages,
  runningJobs,
}: {
  tripId: string;
  initialMessages: Message[];
  runningJobs: number;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

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
      const payload = await response.json();

      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticMessage.id),
        optimisticMessage,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: payload.assistantReply,
          source: "WEB",
        },
      ]);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Trip planning chat</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Web messages and Telegram sync land in one shared planning timeline.
          </p>
        </div>
        <ScrapeIndicator count={runningJobs} />
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
