export type AgentStatus = "running" | "idle" | "blocked";

export type AgentCard = {
  id: string;
  name: string;
  status: AgentStatus;
  directive: string;
  progress: number;
  checkpoint: string;
  stream: "Product" | "Ops" | "Comms" | "Infra";
  icon: string;
};

export type Objective = {
  label: string;
  owner: string;
  stream: AgentCard["stream"];
  status: "In flight" | "Next" | "Blocked";
};

export type ActivityEvent = {
  time: string;
  agent: string;
  message: string;
};

export type WarRoomSnapshot = {
  agents: AgentCard[];
  objectives: Objective[];
  activity: ActivityEvent[];
};

export const mockSnapshot: WarRoomSnapshot = {
  agents: [
    {
      id: "cask",
      name: "Cask Scribe",
      status: "running",
      directive: "Archive reset summary for 12:00 ET",
      progress: 0.68,
      checkpoint: "Next ping · 12:00",
      stream: "Ops",
      icon: "✍️",
    },
    {
      id: "draft",
      name: "Draftwright",
      status: "running",
      directive: "Scaffold War Room UI (tiles + ticker)",
      progress: 0.42,
      checkpoint: "Layout review · 13:30",
      stream: "Product",
      icon: "🧱",
    },
    {
      id: "neon",
      name: "Neon Bard",
      status: "idle",
      directive: "Waiting for tile components",
      progress: 0,
      checkpoint: "Queued",
      stream: "Comms",
      icon: "💡",
    },
    {
      id: "sentinel",
      name: "Cellar Sentinel",
      status: "idle",
      directive: "Next check at 02:00 (night watch)",
      progress: 0,
      checkpoint: "Scheduled",
      stream: "Infra",
      icon: "🛰️",
    },
  ],
  objectives: [
    {
      label: "Deploy neutral War Room shell",
      owner: "Draftwright",
      stream: "Product",
      status: "In flight",
    },
    {
      label: "Wire mock data to Supabase tables",
      owner: "Cask Scribe",
      stream: "Ops",
      status: "Next",
    },
    {
      label: "Prep agent-event writer script",
      owner: "Cellar Sentinel",
      stream: "Infra",
      status: "Next",
    },
    {
      label: "Copy sweep for dashboard tiles",
      owner: "Neon Bard",
      stream: "Comms",
      status: "Blocked",
    },
  ],
  activity: [
    {
      time: "11:02",
      agent: "Draftwright",
      message: "Initialized Next.js app (Tailwind, TS) for jansworkspace.net",
    },
    {
      time: "10:48",
      agent: "Cask Scribe",
      message: "Logged agent roster + War Room spec into docs",
    },
    {
      time: "10:30",
      agent: "Neon Bard",
      message: "Outlined hero + section copy blocks (awaiting layout)",
    },
    {
      time: "09:55",
      agent: "Cellar Sentinel",
      message: "Cron swap confirmed (Archive reset reminders firing)",
    },
    {
      time: "09:10",
      agent: "Tap Hunter",
      message: "No run scheduled · standing by",
    },
  ],
};
