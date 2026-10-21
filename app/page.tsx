export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        AI Travel Planner
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Tell us where you&apos;re going, for how long, and what you enjoy.
        We&apos;ll build a day-by-day plan using real places, with estimated
        costs.
      </p>
      <p className="mt-8 text-sm text-zinc-500">
        The trip form is coming in the next step.
      </p>
    </main>
  );
}
