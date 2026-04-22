import { Suspense } from "react";
import BuilderClient from "./BuilderClient";

export const dynamic = "force-dynamic";

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-5 pb-24 pt-8">
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
              Builder
            </p>
            <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#171717]">
              Journey builder
            </h1>
            <div className="mt-6 rounded-[28px] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
              <div className="animate-pulse space-y-4">
                <div className="h-5 w-36 rounded-full bg-[#ebe5dc]" />
                <div className="h-12 w-full rounded-2xl bg-[#ebe5dc]" />
                <div className="h-5 w-28 rounded-full bg-[#ebe5dc]" />
                <div className="h-12 w-32 rounded-2xl bg-[#ebe5dc]" />
                <div className="h-5 w-24 rounded-full bg-[#ebe5dc]" />
                <div className="h-28 w-full rounded-[28px] bg-[#ebe5dc]" />
              </div>
            </div>
          </section>
        </main>
      }
    >
      <BuilderClient />
    </Suspense>
  );
}