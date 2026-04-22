import Link from "next/link";
import Button from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col justify-between p-6">
      <div className="pt-8">
        <div className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
          Quran hackathon MVP
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Ashara</h1>

        <p className="mt-4 text-base leading-7 text-neutral-600">
          Move through the Qur’an in small guided portions with understanding,
          reflection, and daily action.
        </p>
      </div>

      <div className="pb-2">
        <Link href="/onboarding">
          <Button>Start journey</Button>
        </Link>
      </div>
    </main>
  );
}