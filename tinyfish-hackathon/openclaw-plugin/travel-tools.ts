type TravelSyncPayload = {
  tripId: string;
  messages: Array<{
    senderName: string;
    text: string;
    timestamp: string;
  }>;
};

type TravelCreateTripPayload = {
  chatId: string;
  chatTitle: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  vibes: string[];
  travelerCount: number;
  userId: string;
};

const baseUrl = process.env.TRAVEL_APP_URL;
const secret = process.env.OPENCLAW_WEBHOOK_SECRET;

async function authedFetch(path: string, init: RequestInit) {
  if (!baseUrl || !secret) {
    throw new Error("TRAVEL_APP_URL and OPENCLAW_WEBHOOK_SECRET are required");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Travel app request failed with ${response.status}`);
  }

  return response.json();
}

export async function travel_sync_chat(payload: TravelSyncPayload) {
  return authedFetch("/api/openclaw/sync-chat", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ reply: string }>;
}

export async function travel_get_recommendations(
  tripId: string,
  timeOfDay: "morning" | "afternoon" | "evening" | "night",
) {
  return authedFetch(
    `/api/openclaw/recommendations/${tripId}?timeOfDay=${timeOfDay}`,
    {
      method: "GET",
    },
  ) as Promise<{ recommendations: string }>;
}

export async function travel_create_trip(payload: TravelCreateTripPayload) {
  return authedFetch("/api/openclaw/create-trip", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ tripId: string; message: string }>;
}
