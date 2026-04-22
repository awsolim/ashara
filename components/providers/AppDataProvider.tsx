"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAllJourneysFromDb } from "@/lib/data/db-journeys";
import type { Journey } from "@/lib/data/types";

type AppDataContextValue = {
  journeys: Journey[];
  selectedJourney: Journey | null;
  selectedJourneyId: string;
  setSelectedJourneyId: (journeyId: string) => void;
  refreshJourneys: () => Promise<void>;
  isLoadingJourneys: boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyIdState] = useState("");
  const [isLoadingJourneys, setIsLoadingJourneys] = useState(true);

  const refreshJourneys = useCallback(async () => {
    setIsLoadingJourneys(true);

    try {
      const dbJourneys = await getAllJourneysFromDb();
      setJourneys(dbJourneys);

      const storedSelectedJourneyId =
        localStorage.getItem("ashara_selected_journey_id") ??
        dbJourneys[0]?.id ??
        "";

      const validSelectedJourneyId =
        dbJourneys.find((journey) => journey.id === storedSelectedJourneyId)?.id ??
        dbJourneys[0]?.id ??
        "";

      setSelectedJourneyIdState(validSelectedJourneyId);

      if (validSelectedJourneyId) {
        localStorage.setItem(
          "ashara_selected_journey_id",
          validSelectedJourneyId
        );
      }
    } finally {
      setIsLoadingJourneys(false);
    }
  }, []);

  useEffect(() => {
    refreshJourneys();
  }, [refreshJourneys]);

  const setSelectedJourneyId = useCallback(
    (journeyId: string) => {
      setSelectedJourneyIdState(journeyId);
      localStorage.setItem("ashara_selected_journey_id", journeyId);
    },
    []
  );

  const selectedJourney = useMemo(() => {
    return journeys.find((journey) => journey.id === selectedJourneyId) ?? null;
  }, [journeys, selectedJourneyId]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      journeys,
      selectedJourney,
      selectedJourneyId,
      setSelectedJourneyId,
      refreshJourneys,
      isLoadingJourneys,
    }),
    [
      journeys,
      selectedJourney,
      selectedJourneyId,
      setSelectedJourneyId,
      refreshJourneys,
      isLoadingJourneys,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}