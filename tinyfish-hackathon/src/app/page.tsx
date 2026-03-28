import Link from "next/link";
import {
  ArrowRight,
  Compass,
  MessageCircleMore,
  Sparkles,
  Waves,
  MapPinned,
  Clock3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-14 px-6 py-8 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-400),var(--accent))] text-slate-950 shadow-[0_18px_40px_rgba(87,198,255,0.28)]">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-400)]">
              Wayfinder AI
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">TinyFish research, Telegram-native planning</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Badge>OpenClaw connected</Badge>
          <Badge>TinyFish live</Badge>
        </div>
      </header>
      <section className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[38px] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(10,23,43,0.95),rgba(8,17,31,0.86))] p-8 shadow-[0_40px_120px_rgba(4,10,26,0.5)] sm:p-10">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(87,198,255,0.28),transparent_68%)]" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,198,122,0.18),transparent_68%)]" />
          <div className="relative">
            <Badge className="mb-5 border-[var(--brand-400)]/25 bg-[var(--brand-500)]/10 text-[var(--brand-100)]">
              Shared trip planner for web + Telegram
            </Badge>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-400)]">
            Plan once. Research everywhere.
          </p>
            <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight sm:text-7xl">
              Plan with friends in web chat or Telegram, then let the research happen behind the scenes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
              Turn messy group planning into a live travel intelligence system. Wayfinder listens for signals, launches TinyFish jobs across social and editorial sources, and keeps recommendations ready for the right moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button className="gap-2 px-5 py-3">
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/trips/new">
                <Button variant="secondary" className="px-5 py-3">
                  Create a trip
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-2xl font-semibold">2x</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">input modes: direct web chat and Telegram group sync</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-2xl font-semibold">8</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">research surfaces across social, editorial, and maps</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-2xl font-semibold">24/7</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">trip-mode recommendation delivery windows</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          <Card className="grid gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-500)]/14 text-[var(--brand-300)]">
              <Waves className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Trip-aware research</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              `processUserMessage` stays channel-agnostic while web chat and Telegram/OpenClaw feed the same orchestration engine.
            </p>
          </Card>
          <Card className="grid gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <MessageCircleMore className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Telegram group sync</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Friends can chat naturally in the group. OpenClaw lifts only the relevant planning signals into the trip brain.
            </p>
          </Card>
          <Card className="grid gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warm)]/12 text-[var(--warm)]">
              <Clock3 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Live recommendation windows</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Morning cafes, afternoon activities, dinner spots, and late-night plans are ranked for the moment they matter.
            </p>
          </Card>
          <Card className="grid gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Example flow</p>
              <MapPinned className="h-4 w-4 text-[var(--brand-300)]" />
            </div>
            <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <p>1. Group says “one club night, one surf lesson, no tourist traps.”</p>
              <p>2. Wayfinder launches parallel TinyFish research in the background.</p>
              <p>3. The trip workspace fills with discoveries and live recommendations.</p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
