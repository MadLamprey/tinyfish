import { TripCreationForm } from "@/components/trips/TripCreationForm";

export default function NewTripPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl gap-6 px-6 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-400)]">
          New trip
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Create the next planning space</h1>
      </div>
      <TripCreationForm />
    </main>
  );
}
