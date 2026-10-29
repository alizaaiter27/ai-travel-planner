import TripPlanner from "@/components/TripPlanner";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        AI Travel Planner
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Tell us where you&apos;re going, for how long, and what you enjoy.
        We&apos;ll build a day-by-day plan using real places, with estimated
        costs.
      </p>
      <div className="mt-10">
        <TripPlanner />
      </div>
    </main>
  );
}
