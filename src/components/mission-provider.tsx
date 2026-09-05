"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bloom, ImpactMetrics, Mission, Profile } from "@/types/kaki";

type NewMission = Pick<Mission, "title" | "originalRequest" | "category" | "language" | "durationMinutes" | "location" | "scheduledAt" | "summary" | "guide" | "safetyLevel">;
type MissionContextValue = {
  profile: Profile;
  missions: Mission[];
  blooms: Bloom[];
  impact: ImpactMetrics;
  addMission: (mission: NewMission) => Promise<Mission>;
  acceptMission: (id: string) => Promise<void>;
  cancelMission: (id: string) => Promise<void>;
  startMission: (id: string) => Promise<void>;
  completeMission: (id: string, story?: string, consentToShare?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  syncError: string;
};

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children, profile, initialMissions, initialBlooms }: {
  children: ReactNode;
  profile: Profile;
  initialMissions: Mission[];
  initialBlooms: Bloom[];
}) {
  const [missions, setMissions] = useState(initialMissions);
  const [blooms, setBlooms] = useState(initialBlooms);
  const [syncError, setSyncError] = useState("");
  const refreshId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++refreshId.current;
    const [missionsResponse, bloomsResponse] = await Promise.all([
      fetch("/api/missions", { cache: "no-store" }),
      fetch("/api/blooms", { cache: "no-store" }),
    ]);
    if (missionsResponse.status === 401 || bloomsResponse.status === 401) throw new Error("Your session has ended. Refresh to rejoin.");
    if (!missionsResponse.ok || !bloomsResponse.ok) throw new Error("Could not refresh community activity.");
    const [missionPayload, bloomPayload] = await Promise.all([
      missionsResponse.json() as Promise<{ missions: Mission[] }>,
      bloomsResponse.json() as Promise<{ blooms: Bloom[] }>,
    ]);
    if (id === refreshId.current) {
      setMissions(missionPayload.missions);
      setBlooms(bloomPayload.blooms);
      setSyncError("");
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const sync = () => { if (document.visibilityState === "visible") void refresh().catch(() => setSyncError("Connection interrupted. Reconnecting…")); };
    const channel = supabase
      .channel("kaki-live-product")
      .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, sync)
      .on("postgres_changes", { event: "*", schema: "public", table: "blooms" }, sync)
      .subscribe();
    const interval = window.setInterval(sync, 5000);
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", sync); window.removeEventListener("online", sync); void supabase.removeChannel(channel); };
  }, [refresh]);

  const impact = useMemo<ImpactMetrics>(() => ({
    neighbourMoments: blooms.length,
    minutesShared: missions.filter((mission) => mission.status === "completed").reduce((sum, mission) => sum + mission.durationMinutes, 0),
    skillsExchanged: missions.filter((mission) => mission.status === "completed" && mission.category === "skills").length,
    itemsSaved: missions.filter((mission) => mission.status === "completed" && mission.category === "repair").length,
  }), [blooms.length, missions]);

  async function addMission(input: NewMission) {
    const response = await fetch("/api/missions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const payload = await response.json() as { mission?: Mission; error?: string };
    if (!response.ok || !payload.mission) throw new Error(response.status === 401 ? "Please sign in before publishing this mission." : payload.error || "Could not publish your mission.");
    setMissions((current) => [payload.mission!, ...current]);
    return payload.mission;
  }

  async function updateMission(id: string, action: "claim" | "start" | "complete" | "cancel", story?: string, consentToShare = false) {
    const response = await fetch(`/api/missions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, story, consentToShare }) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(response.status === 401 ? "Please sign in to update this mission." : payload.error || "Could not update this mission.");
    await refresh();
  }

  const value: MissionContextValue = {
    profile,
    missions,
    blooms,
    impact,
    addMission,
    acceptMission: (id) => updateMission(id, "claim"),
    cancelMission: (id) => updateMission(id, "cancel"),
    startMission: (id) => updateMission(id, "start"),
    completeMission: (id, story, consentToShare) => updateMission(id, "complete", story, consentToShare),
    refresh,
    syncError,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMissions() {
  const value = useContext(MissionContext);
  if (!value) throw new Error("useMissions must be used inside MissionProvider");
  return value;
}
