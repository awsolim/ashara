"use client";

import BottomNav from "@/components/navigation/BottomNav";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <>
      <main className="min-h-screen px-5 pb-32 pt-8">
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
            Settings
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#171717]">
            Settings
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#67625b]">
            This area is under construction.
          </p>
        </section>

        <section className="mt-7">
          <Card className="bg-white">
            <p className="text-lg font-medium tracking-tight text-[#171717]">
              More controls are coming later.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#5f5a53]">
              For now, the app is focused on journeys, lessons, action, and
              check-in.
            </p>
          </Card>
        </section>
      </main>

      <BottomNav />
    </>
  );
}