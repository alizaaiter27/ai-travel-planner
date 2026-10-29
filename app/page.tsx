import HomeHero from "@/components/HomeHero";
import HowItWorks from "@/components/HowItWorks";
import RecentTrips from "@/components/RecentTrips";
import TripPlanner from "@/components/TripPlanner";

// Order follows the "input first" landing pattern: promise → the tool
// itself → returning visitors' trips → how it works / why trust it.
export default function Home() {
  return (
    <main className="flex-1">
      <HomeHero />

      <section
        id="plan"
        aria-labelledby="plan-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-4 px-4 py-14 sm:px-6 sm:py-16"
      >
        <h2 id="plan-heading" className="text-3xl font-semibold tracking-tight">
          Plan your trip
        </h2>
        <p className="mt-2 text-ink-muted">
          Takes about half a minute. Nothing to sign up for.
        </p>
        <div className="mt-8">
          <TripPlanner />
        </div>
        <div className="mt-16">
          <RecentTrips />
        </div>
      </section>

      <HowItWorks />
    </main>
  );
}
