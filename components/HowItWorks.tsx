import { CheckIcon, PencilIcon, SearchIcon, SparklesIcon, XIcon } from "@/components/icons";

const STEPS = [
  {
    icon: PencilIcon,
    title: "Tell us about your trip",
    text: "Destination, number of days, budget, and what you enjoy.",
  },
  {
    icon: SearchIcon,
    title: "We find real places",
    text: "Google Places returns attractions and restaurants in that area.",
  },
  {
    icon: SparklesIcon,
    title: "AI arranges your days",
    text: "Only those places, in a sensible order, on a map, with a budget estimate.",
  },
];

const COMPARISON = [
  { topic: "Places", chatbot: "Can invent places or include closed ones", us: "Every stop is a real Google place" },
  { topic: "Costs", chatbot: "Totals can be added up wrong", us: "All sums done by code, labelled as estimates" },
  { topic: "Planning", chatbot: "A wall of text", us: "A day-by-day plan with a map you can share" },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="how-heading" className="text-3xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-xl border border-line bg-canvas p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon />
                </span>
                <span className="text-sm font-medium text-ink-muted">Step {index + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{text}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 text-3xl font-semibold tracking-tight">
          Why not just ask a chatbot?
        </h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Chatbots write lovely itineraries, but they can confidently include
          restaurants that closed years ago, or never existed. Here the AI
          only organises; the facts come from real data.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className="hidden px-3 py-3 sm:px-4 font-medium sm:table-cell">
                  <span className="sr-only">Topic</span>
                </th>
                <th scope="col" className="px-3 py-3 sm:px-4 font-medium">A general chatbot</th>
                <th scope="col" className="px-3 py-3 sm:px-4 font-medium">AI Travel Planner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPARISON.map(({ topic, chatbot, us }) => (
                <tr key={topic} className="align-top">
                  <th scope="row" className="hidden px-3 py-3 sm:px-4 font-medium sm:table-cell">{topic}</th>
                  <td className="px-3 py-3 sm:px-4 text-ink-muted">
                    <span className="flex gap-2">
                      <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      {chatbot}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <span className="flex gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                      {us}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
