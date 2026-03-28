import type {
  MessageSource,
  PlaceCategory,
  PriceLevel,
  RecommendationStatus,
  ScrapeStatus,
  TripStatus,
} from "@prisma/client";

export type AppTripStatus = TripStatus;
export type AppScrapeStatus = ScrapeStatus;
export type AppRecommendationStatus = RecommendationStatus;
export type AppMessageSource = MessageSource;
export type AppPlaceCategory = PlaceCategory;
export type AppPriceLevel = PriceLevel;

export type TinyFishScrapeJob = {
  platform: string;
  url: string;
  goal: string;
  stealth: boolean;
};

export type ExtractedIntents = {
  interests: string[];
  constraints: string[];
  specificRequests: string[];
  datePreferences: Record<string, string>;
};

export type OrchestratorResult = {
  assistantReply: string;
  scrapeJobsToLaunch: TinyFishScrapeJob[];
  extractedIntents: ExtractedIntents;
};

export type TelegramSyncMessage = {
  senderName: string;
  text: string;
  timestamp: string;
  telegramMessageId?: number;
};
