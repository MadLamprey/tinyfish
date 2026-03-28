"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function TelegramLinkPanel({
  tripId,
  initialChatId,
  initialChatTitle,
}: {
  tripId: string;
  initialChatId?: string | null;
  initialChatTitle?: string | null;
}) {
  const [chatId, setChatId] = useState(initialChatId ?? "");
  const [chatTitle, setChatTitle] = useState(initialChatTitle ?? "");

  async function saveLink() {
    await fetch(`/api/trips/${tripId}/link-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramChatId: chatId, telegramChatTitle: chatTitle }),
    });
  }

  async function unlink() {
    await fetch(`/api/trips/${tripId}/link-telegram`, { method: "DELETE" });
    setChatId("");
    setChatTitle("");
  }

  return (
    <Card className="grid gap-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        Add your bot to the group and send <code>/link {tripId}</code> so OpenClaw can sync planning messages.
      </p>
      <Input value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="Telegram chat ID" />
      <Input value={chatTitle} onChange={(event) => setChatTitle(event.target.value)} placeholder="Telegram chat title" />
      <div className="flex gap-3">
        <Button onClick={saveLink}>Link Telegram Group</Button>
        <Button variant="secondary" onClick={unlink}>
          Unlink
        </Button>
      </div>
    </Card>
  );
}
