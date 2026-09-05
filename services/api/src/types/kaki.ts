export const missionCategories = [
  "digital",
  "wellbeing",
  "repair",
  "food",
  "skills",
] as const;

export type MissionCategory = (typeof missionCategories)[number];
export type MissionStatus =
  | "draft"
  | "open"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "flagged";
export type UserRole = "resident" | "helper" | "organiser";

export type Profile = {
  id: string;
  name: string;
  role: UserRole;
  onboardedAt?: string;
  isGuest?: boolean;
  ageBand: string;
  languages: string[];
  avatarTone: "purple" | "coral" | "green" | "yellow";
  skills: string[];
  verified: boolean;
  bio: string;
};

export type Mission = {
  id: string;
  title: string;
  originalRequest: string;
  category: MissionCategory;
  status: MissionStatus;
  requester: Profile;
  helper?: Profile;
  language: string;
  durationMinutes: number;
  location: string;
  scheduledAt: string;
  summary: string;
  guide: string[];
  accessibilityNotes?: string;
  safetyLevel: "community" | "review";
  createdAt: string;
  isDemo?: boolean;
};

export type MissionPresence = {
  mission_id: string;
  user_id: string;
  on_way_at: string | null;
  arrived_at: string | null;
  consent_to_share: boolean;
  reflection: string;
};

export type Bloom = {
  id: string;
  missionId: string;
  category: MissionCategory;
  title: string;
  story: string;
  participantNames: string[];
  createdAt: string;
};

export type CommunityMessage = {
  id: string;
  missionId: string;
  body: string;
  isSystem: boolean;
  sender: Profile;
  createdAt: string;
};

export type CommunityNotification = {
  id: string;
  missionId?: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
};

export type ImpactMetrics = {
  neighbourMoments: number;
  minutesShared: number;
  skillsExchanged: number;
  itemsSaved: number;
};
