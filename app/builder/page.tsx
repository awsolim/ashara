"use client";

import { useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { useAppData } from "@/components/providers/AppDataProvider";
import {
  getJourneyCardTheme,
  getJourneySubtitle,
  slugifyJourneyName,
} from "@/lib/data/journey-builder";
import { createJourneyInDb, updateJourneyInDb, uploadJourneyArt } from "@/lib/data/db-builder";

const swatches = [
  "#7CC8D0",
  "#7A9660",
  "#D9C07A",
  "#B8A8D8",
  "#D8A18A",
  "#8BA6D9",
  "#91B8A8",
  "#C79D7C",
  "#A55D52",
  "#5F7DB8",
];

type MenuType = "add" | "edit" | null;
type ActionType = "journey" | "lesson" | null;

type BuilderForm = {
  journeyId: string;
  surahName: string;
  cardColor: string;
  artImageUrl: string;
};

const emptyForm: BuilderForm = {
  journeyId: "",
  surahName: "",
  cardColor: "#7CC8D0",
  artImageUrl: "",
};

export default function BuilderPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { journeys, refreshJourneys, isLoadingJourneys } = useAppData();

  const [menuOpen, setMenuOpen] = useState<MenuType>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selectedEditId, setSelectedEditId] = useState("");
  const [form, setForm] = useState<BuilderForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const previewTheme = useMemo(
    () => getJourneyCardTheme(form.cardColor || "#7CC8D0"),
    [form.cardColor]
  );

  const previewSubtitle = useMemo(() => {
    return {
      title: "This is your lesson title",
      meta: "Lesson 1 of 2",
    };
  }, []);

  function resetMessages() {
    setSavedMessage("");
    setErrorMessage("");
  }

  function openAddJourney() {
    setMode("add");
    setActiveAction("journey");
    setMenuOpen(null);
    resetMessages();
    setSelectedFile(null);
    setPreviewImageUrl("");
    setForm(emptyForm);
  }

  function openEditJourney() {
    const firstJourney = journeys[0];
    if (!firstJourney) return;

    const targetId = selectedEditId || firstJourney.id;
    const journey = journeys.find((item) => item.id === targetId) ?? firstJourney;

    setMode("edit");
    setActiveAction("journey");
    setMenuOpen(null);
    resetMessages();
    setSelectedEditId(journey.id);
    setSelectedFile(null);
    setPreviewImageUrl(journey.artImage ?? "");
    setForm({
      journeyId: journey.id,
      surahName: journey.surahName,
      cardColor: journey.cardColor ?? "#7CC8D0",
      artImageUrl: journey.artImage ?? "",
    });
  }

  function handleImageUpload(file?: File | null) {
    if (!file) return;

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
  }

  async function saveJourney() {
    const trimmedName = form.surahName.trim();

    if (!trimmedName) {
      setErrorMessage("Journey name is required.");
      return;
    }

    setIsSaving(true);
    resetMessages();

    try {
      const resolvedJourneyId =
        mode === "add" ? slugifyJourneyName(trimmedName) : form.journeyId;

      if (!resolvedJourneyId) {
        throw new Error("Could not generate a journey id.");
      }

      let artImageUrl: string | null = form.artImageUrl || null;

      if (selectedFile) {
        artImageUrl = await uploadJourneyArt(selectedFile, resolvedJourneyId);
      }

      if (mode === "add") {
        await createJourneyInDb({
          surahName: trimmedName,
          cardColor: form.cardColor,
          artImageUrl,
        });

        setSavedMessage("Journey added.");
        setForm({
          journeyId: resolvedJourneyId,
          surahName: trimmedName,
          cardColor: form.cardColor,
          artImageUrl: artImageUrl ?? "",
        });
      } else {
        await updateJourneyInDb({
          id: resolvedJourneyId,
          surahName: trimmedName,
          cardColor: form.cardColor,
          artImageUrl,
        });

        setSavedMessage("Journey updated.");
        setForm((current) => ({
          ...current,
          artImageUrl: artImageUrl ?? "",
        }));
      }

      setSelectedFile(null);
      await refreshJourneys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  const previewName = form.surahName.trim() || "Surah Name";
  const previewArt = previewImageUrl || form.artImageUrl;

  return (
    <main className="min-h-screen px-5 pb-24 pt-8">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
            Builder
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#171717]">
            Journey builder
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#67625b]">
            Add and style journeys now. Lesson creation comes next.
          </p>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === "add" ? null : "add")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d1c8] bg-white text-xl text-[#3f3a34] shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === "edit" ? null : "edit")}
            className="rounded-full border border-[#d8d1c8] bg-white px-4 py-3 text-sm font-medium text-[#3f3a34] shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
          >
            Edit
          </button>

          {menuOpen === "add" ? (
            <div className="absolute right-0 top-14 z-20 min-w-[180px] rounded-2xl border border-[#e3dbcf] bg-white p-2 shadow-[0_14px_30px_rgba(0,0,0,0.10)]">
              <button
                type="button"
                onClick={openAddJourney}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
              >
                Add journey
              </button>
              <button
                type="button"
                disabled
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#a0998e]"
              >
                Add lesson (later)
              </button>
            </div>
          ) : null}

          {menuOpen === "edit" ? (
            <div className="absolute right-0 top-14 z-20 min-w-[180px] rounded-2xl border border-[#e3dbcf] bg-white p-2 shadow-[0_14px_30px_rgba(0,0,0,0.10)]">
              <button
                type="button"
                onClick={openEditJourney}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
              >
                Edit journey
              </button>
              <button
                type="button"
                disabled
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#a0998e]"
              >
                Edit lesson (later)
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <Card className="bg-white">
          <div className="space-y-4">
            {mode === "edit" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                  Journey to edit
                </span>
                <select
                  value={selectedEditId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setSelectedEditId(nextId);

                    const journey = journeys.find((item) => item.id === nextId);
                    if (!journey) return;

                    setSelectedFile(null);
                    setPreviewImageUrl(journey.artImage ?? "");
                    setForm({
                      journeyId: journey.id,
                      surahName: journey.surahName,
                      cardColor: journey.cardColor ?? "#7CC8D0",
                      artImageUrl: journey.artImage ?? "",
                    });
                  }}
                  className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717]"
                >
                  {journeys.map((journey) => (
                    <option key={journey.id} value={journey.id}>
                      {journey.surahName.replace(/^Surah\s+/i, "")}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                Full journey name
              </span>
              <input
                value={form.surahName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    surahName: event.target.value,
                    journeyId:
                      mode === "add"
                        ? slugifyJourneyName(event.target.value)
                        : current.journeyId,
                  }))
                }
                placeholder="Surah Al-Mulk"
                className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717] outline-none placeholder:text-[#9b948a]"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                Left art image
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm font-medium text-[#171717]"
                >
                  Upload image
                </button>

                {previewArt ? (
                  <div className="h-14 w-10 overflow-hidden rounded-lg border border-[#ddd4c8] bg-white">
                    <img
                      src={previewArt}
                      alt=""
                      className="h-full w-full object-cover object-left"
                    />
                  </div>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  handleImageUpload(event.target.files?.[0] ?? null)
                }
                className="hidden"
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                Card color
              </span>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.cardColor}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cardColor: event.target.value,
                    }))
                  }
                  className="h-12 w-16 cursor-pointer rounded-xl border border-[#ddd4c8] bg-transparent"
                />

                <div className="flex flex-wrap gap-2">
                  {swatches.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          cardColor: color,
                        }))
                      }
                      className="h-8 w-8 rounded-full border border-white shadow"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f8f5ef] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
                Preview
              </p>

              <div className="mt-4 relative overflow-hidden rounded-[28px] shadow-[0_14px_30px_rgba(0,0,0,0.10)]">
                <div
                  className="flex min-h-[122px]"
                  style={{ backgroundColor: form.cardColor }}
                >
                  <div className="relative w-[22%] shrink-0 overflow-hidden rounded-l-[28px]">
                    {previewArt ? (
                      <img
                        src={previewArt}
                        alt=""
                        className="h-full w-full object-cover object-left"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/5 text-[11px] font-medium text-[#8a847c]">
                        Art
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent via-white/55 to-white/90" />
                  </div>

                  <div className="relative flex flex-1 flex-col justify-center py-4 pl-4 pr-24">
                    <div
                      className={`absolute right-5 top-4 rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm ${previewTheme.badgeClass}`}
                    >
                      50%
                    </div>

                    <div className="min-w-0">
                      <h2
                        className={`text-[1.75rem] font-semibold leading-tight tracking-tight ${previewTheme.titleClass}`}
                      >
                        {previewName.replace(/^Surah\s+/i, "")}
                      </h2>

                      <p
                        className={`mt-1 truncate text-[13px] font-semibold leading-5 ${previewTheme.subtitleClass}`}
                      >
                        {previewSubtitle.title}
                      </p>

                      <p
                        className={`mt-0.5 text-[12px] font-medium leading-5 ${previewTheme.metaClass}`}
                      >
                        {previewSubtitle.meta}
                      </p>
                    </div>

                    <div className="mt-4">
                      <div
                        className={`h-2.5 w-full rounded-full ${previewTheme.progressTrackClass}`}
                      >
                        <div
                          className={`h-2.5 w-1/2 rounded-full ${previewTheme.progressFillClass}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={saveJourney}
              disabled={isSaving || isLoadingJourneys}
              className="w-full rounded-2xl bg-[#1d5f63] px-4 py-4 text-base font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {isSaving
                ? "Saving..."
                : mode === "add"
                ? "Save journey"
                : "Save journey style"}
            </button>

            {savedMessage ? (
              <p className="text-sm font-medium text-[#1d5f63]">{savedMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="text-sm font-medium text-[#a23d35]">{errorMessage}</p>
            ) : null}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
            Current journeys
          </p>

          <div className="mt-4 space-y-3">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className="flex items-center justify-between rounded-2xl bg-[#fcfbf8] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#171717]">
                    {journey.surahName}
                  </p>
                  <p className="mt-1 text-xs text-[#7b756d]">
                    {journey.segments.length} total sessions
                  </p>
                </div>

                <div
                  className="h-4 w-4 rounded-full border border-white shadow"
                  style={{ backgroundColor: journey.cardColor ?? "#7CC8D0" }}
                />
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}