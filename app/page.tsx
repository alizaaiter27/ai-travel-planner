import RecentTrips from "@/components/RecentTrips";
import TripPlanner from "@/components/TripPlanner";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <h1 id="plan" className="scroll-mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
        Plan a trip with real places
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink-muted">
        Tell us where you&apos;re going, for how long, and what you enjoy.
        We&apos;ll build a day-by-day plan using real places, with estimated
        costs.
      </p>
      <div className="mt-10">
        <TripPlanner />
      </div>
      <div className="mt-16">
        <RecentTrips />
      </div>
    </main>
  );
}
