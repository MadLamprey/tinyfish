"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VibeSelector } from "@/components/trips/VibeSelector";

export function TripCreationForm() {
  const router = useRouter();
  const [destinationCities, setDestinationCities] = useState("Tokyo, Kyoto");
  const [vibes, setVibes] = useState<string[]>(["foodie", "nightlife"]);
  const [title, setTitle] = useState("New Trip");
  const [travelerCount, setTravelerCount] = useState(2);
  const [startDate, setStartDate] = useState("2026-07-10T00:00");
  const [endDate, setEndDate] = useState("2026-07-17T00:00");
  const [timezone, setTimezone] = useState("Asia/Tokyo");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramChatTitle, setTelegramChatTitle] = useState("");

  async function handleSubmit() {
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        destinationCities: destinationCities.split(",").map((item) => item.trim()).filter(Boolean),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        travelerCount,
        vibes,
        timezone,
        telegramChatId: telegramChatId || undefined,
        telegramChatTitle: telegramChatTitle || undefined,
      }),
    });

    const payload = await response.json();
    router.push(`/trips/${payload.id}`);
  }

  return (
    <Card className="grid gap-4">
      <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Trip title" />
      <Input
        value={destinationCities}
        onChange={(event) => setDestinationCities(event.target.value)}
        placeholder="Tokyo, Kyoto"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <Input type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
      </div>
      <Input
        type="number"
        min={1}
        value={travelerCount}
        onChange={(event) => setTravelerCount(Number(event.target.value))}
        placeholder="Traveler count"
      />
      <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Timezone" />
      <VibeSelector
        selected={vibes}
        onToggle={(value) =>
          setVibes((current) =>
            current.includes(value)
              ? current.filter((item) => item !== value)
              : [...current, value],
          )
        }
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={telegramChatId}
          onChange={(event) => setTelegramChatId(event.target.value)}
          placeholder="Optional Telegram chat ID"
        />
        <Input
          value={telegramChatTitle}
          onChange={(event) => setTelegramChatTitle(event.target.value)}
          placeholder="Optional Telegram chat title"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>Create trip</Button>
      </div>
    </Card>
  );
}
