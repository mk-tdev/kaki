"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { demoBlooms, demoImpact, demoMissions, profiles } from "@/data/demo";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Bloom, ImpactMetrics, Mission } from "@/types/kaki";

const STORAGE_KEY = "kaki-product-state-v1";
const CHANGE_EVENT = "kaki-state-change";
const defaultState: PersistedState = { missions: demoMissions, blooms: demoBlooms };
let cachedRaw: string | null = null;
let cachedState: PersistedState = defaultState;

type PersistedState = { missions: Mission[]; blooms: Bloom[] };
type NewMission = Pick<Mission, "title" | "originalRequest" | "category" | "language" | "durationMinutes" | "location" | "scheduledAt" | "summary" | "guide" | "safetyLevel">;
type MissionContextValue = {
  missions: Mission[];
  blooms: Bloom[];
  impact: ImpactMetrics;
  addMission: (mission: NewMission) => Promise<Mission>;
  acceptMission: (id: string) => Promise<void>;
  startMission: (id: string) => Promise<void>;
  completeMission: (id: string, story?: string) => Promise<void>;
  resetDemo: () => void;
};

const MissionContext = createContext<MissionContextValue | null>(null);

function getClientSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  if (!raw) { cachedState = defaultState; return cachedState; }
  try { cachedState = JSON.parse(raw) as PersistedState; } catch { cachedState = defaultState; }
  return cachedState;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(CHANGE_EVENT, callback); window.removeEventListener("storage", callback); };
}

function writeState(next: PersistedState) {
  const raw = JSON.stringify(next);
  cachedRaw = raw; cachedState = next;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function MissionProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getClientSnapshot, () => defaultState);
  const { missions, blooms } = state;
  const remoteEnabled = hasSupabaseEnv();

  useEffect(() => {
    if (!remoteEnabled) return;
    let cancelled = false;
    void fetch("/api/missions").then(async (response) => {
      if (!response.ok || cancelled) return;
      const payload = await response.json() as { missions?: Mission[] };
      if (payload.missions) writeState({ missions: payload.missions, blooms: getClientSnapshot().blooms });
    });
    return () => { cancelled = true; };
  }, [remoteEnabled]);

  const impact = useMemo(() => {
    const completedAfterSeed = Math.max(0, blooms.length - demoBlooms.length);
    const completedMinutes = missions.filter((mission) => mission.status === "completed" && !demoMissions.some((item) => item.id === mission.id)).reduce((sum, mission) => sum + mission.durationMinutes, 0);
    return { neighbourMoments: demoImpact.neighbourMoments + completedAfterSeed, minutesShared: demoImpact.minutesShared + completedMinutes, skillsExchanged: demoImpact.skillsExchanged + Math.max(0, missions.filter((mission) => mission.status === "completed" && mission.category === "skills").length - 1), itemsSaved: demoImpact.itemsSaved + missions.filter((mission) => mission.status === "completed" && mission.category === "repair").length };
  }, [blooms.length, missions]);

  async function addMission(input: NewMission) {
    if (remoteEnabled) {
      const response = await fetch("/api/missions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) throw new Error(response.status === 401 ? "Please sign in before publishing this mission." : "Could not publish your mission.");
      const payload = await response.json() as { mission: Mission };
      writeState({ ...state, missions: [payload.mission, ...missions] });
      return payload.mission;
    }
    const mission: Mission = { ...input, id: `mission-${Date.now()}`, requester: profiles[0], status: input.safetyLevel === "review" ? "flagged" : "open", createdAt: new Date().toISOString() };
    writeState({ ...state, missions: [mission, ...missions] });
    return mission;
  }

  function updateLocalStatus(id: string, status: Mission["status"], helper = false) {
    writeState({ ...state, missions: missions.map((mission) => mission.id === id ? { ...mission, status, helper: helper ? profiles[1] : mission.helper } : mission) });
  }

  async function updateRemote(id: string, action: "claim" | "start" | "complete", story?: string) {
    if (!remoteEnabled) return;
    const response = await fetch(`/api/missions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, story, consentToShare: true }) });
    if (!response.ok) throw new Error(response.status === 401 ? "Please sign in to update this mission." : "Could not update this mission.");
  }

  async function completeMission(id: string, story?: string) {
    await updateRemote(id, "complete", story);
    const mission = missions.find((item) => item.id === id);
    const nextMissions = missions.map((item) => item.id === id ? { ...item, status: "completed" as const } : item);
    if (!mission || blooms.some((bloom) => bloom.missionId === id)) { writeState({ missions: nextMissions, blooms }); return; }
    const bloom: Bloom = { id: `bloom-${Date.now()}`, missionId: mission.id, category: mission.category, title: mission.title, story: story || `${mission.requester.name} and ${mission.helper?.name ?? "a neighbour"} shared one small, meaningful moment.`, participantNames: [mission.requester.name, mission.helper?.name ?? "A Kaki"], createdAt: new Date().toISOString() };
    writeState({ missions: nextMissions, blooms: [bloom, ...blooms] });
  }

  const value: MissionContextValue = { missions, blooms, impact, addMission, acceptMission: async (id) => { await updateRemote(id, "claim"); updateLocalStatus(id, "matched", true); }, startMission: async (id) => { await updateRemote(id, "start"); updateLocalStatus(id, "in_progress"); }, completeMission, resetDemo: () => writeState(defaultState) };
  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMissions() {
  const value = useContext(MissionContext);
  if (!value) throw new Error("useMissions must be used inside MissionProvider");
  return value;
}
