import { env } from "@/lib/env";

type TinyFishOptions = {
  stealth?: boolean;
  proxyCountry?: string;
};

type TinyFishRunStatus = {
  status: string;
  result?: unknown;
};

function buildBody(url: string, goal: string, options?: TinyFishOptions) {
  const stealth = options?.stealth ?? false;

  return {
    url,
    goal,
    browser_profile: stealth ? "stealth" : "lite",
    proxy_config: stealth
      ? {
          enabled: true,
          country_code: options?.proxyCountry ?? "US",
        }
      : {
          enabled: false,
        },
  };
}

async function tinyfishFetch(path: string, init: RequestInit) {
  const response = await fetch(`https://agent.tinyfish.ai${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.TINYFISH_API_KEY,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`TinyFish request failed with ${response.status}`);
  }

  return response;
}

const SCRAPE_TIMEOUT_MS = 120_000;

export async function scrapeSingle(
  url: string,
  goal: string,
  options?: TinyFishOptions,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  try {
    const response = await tinyfishFetch("/v1/automation/run-sse", {
      method: "POST",
      body: JSON.stringify(buildBody(url, goal, options)),
      signal: controller.signal,
    });

    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("TinyFish SSE stream missing body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const line = chunk
          .split("\n")
          .find((candidate) => candidate.trim().startsWith("data:"));

        if (!line) {
          continue;
        }

        const payload = JSON.parse(line.replace(/^data:\s*/, ""));

        if (
          payload.type === "COMPLETE" &&
          payload.status === "COMPLETED" &&
          payload.result
        ) {
          return payload.result;
        }
      }
    }

    throw new Error("TinyFish SSE stream ended without a completed result");
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapeBatch(
  jobs: Array<{ url: string; goal: string; stealth: boolean }>,
): Promise<string[]> {
  const response = await tinyfishFetch("/v1/automation/run-batch", {
    method: "POST",
    body: JSON.stringify({
      runs: jobs.map((job) => buildBody(job.url, job.goal, { stealth: job.stealth })),
    }),
  });

  const payload = (await response.json()) as {
    run_ids?: string[];
    error?: string | null;
  };

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.run_ids ?? [];
}

export async function getRunStatus(runId: string): Promise<TinyFishRunStatus> {
  const response = await tinyfishFetch(`/v1/automation/run/${runId}`, {
    method: "GET",
  });

  return (await response.json()) as TinyFishRunStatus;
}
