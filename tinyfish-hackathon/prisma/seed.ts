import bcrypt from "bcryptjs";
import { PrismaClient, TripStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo-password", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@travel.test" },
    update: {},
    create: {
      email: "demo@travel.test",
      name: "Demo Traveler",
      passwordHash,
    },
  });

  await prisma.trip.upsert({
    where: { id: "demo-trip-web" },
    update: {},
    create: {
      id: "demo-trip-web",
      userId: user.id,
      title: "Tokyo Summer Sprint",
      destinationCities: ["Tokyo", "Kyoto"],
      startDate: new Date("2026-07-10T00:00:00.000Z"),
      endDate: new Date("2026-07-18T00:00:00.000Z"),
      travelerCount: 3,
      vibes: ["foodie", "nightlife", "hidden gems"],
      status: TripStatus.PLANNING,
      timezone: "Asia/Tokyo",
    },
  });

  await prisma.trip.upsert({
    where: { id: "demo-trip-telegram" },
    update: {},
    create: {
      id: "demo-trip-telegram",
      userId: user.id,
      title: "Barcelona Group Escape",
      destinationCities: ["Barcelona"],
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-08-22T00:00:00.000Z"),
      travelerCount: 5,
      vibes: ["beach", "clubbing", "budget-friendly"],
      status: TripStatus.PLANNING,
      timezone: "Europe/Madrid",
      telegramChatId: "-1001234567890",
      telegramChatTitle: "Barcelona Crew",
    },
  });

  await prisma.telegramSync.upsert({
    where: { tripId: "demo-trip-telegram" },
    update: {},
    create: {
      tripId: "demo-trip-telegram",
      chatId: "-1001234567890",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
