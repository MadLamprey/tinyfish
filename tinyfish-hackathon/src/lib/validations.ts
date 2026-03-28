import { z } from "zod";

export const tripSchema = z.object({
  title: z.string().min(2).max(120),
  destinationCities: z.array(z.string().min(2)).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  travelerCount: z.number().int().min(1).max(50),
  vibes: z.array(z.string().min(2)).min(1),
  timezone: z.string().min(2),
  telegramChatId: z.string().optional(),
  telegramChatTitle: z.string().optional(),
});

export const tripUpdateSchema = tripSchema.partial();

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(6000),
});

export const recommendationStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "DISMISSED"]),
});

export const telegramLinkSchema = z.object({
  telegramChatId: z.string().min(3),
  telegramChatTitle: z.string().min(1),
});

export const openClawSyncSchema = z.object({
  tripId: z.string().min(1),
  messages: z
    .array(
      z.object({
        senderName: z.string().min(1),
        text: z.string().min(1),
        timestamp: z.string(),
        telegramMessageId: z.number().int().optional(),
      }),
    )
    .min(1),
});

export const openClawCreateTripSchema = z.object({
  chatId: z.string().min(1),
  chatTitle: z.string().min(1),
  destinations: z.array(z.string().min(2)).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  vibes: z.array(z.string().min(2)).min(1),
  travelerCount: z.number().int().min(1),
  userId: z.string().min(1),
});
