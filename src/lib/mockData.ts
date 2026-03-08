export type AgentStatus = "running" | "idle" | "blocked";

export type AgentCard = {
  id: string;
  name: string;
  status: AgentStatus;
  directive: string;
  progress: number;
  checkpoint: string;
  stream: "Build" | "QA" | "Catalog" | "Content" | "Creative";
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
      id: "draft",
      name: "Draftwright",
      status: "running",
      directive: "Blueprint site map + section build checklist",
      progress: 0.64,
      checkpoint: "Checklist sync · 11:30",
      stream: "Build",
      icon: "🧱",
    },
    {
      id: "sentinel",
      name: "Cellar Sentinel",
      status: "idle",
      directive: "Click through nav + checkout QA",
      progress: 0.0,
      checkpoint: "Next sweep · 13:00",
      stream: "QA",
      icon: "🛰️",
    },
    {
      id: "cask",
      name: "Cask Scribe",
      status: "running",
      directive: "Normalize product metadata + collections",
      progress: 0.44,
      checkpoint: "Catalog push · 10:15",
      stream: "Catalog",
      icon: "✍️",
    },
    {
      id: "neon",
      name: "Neon Bard",
      status: "running",
      directive: "Draft microcopy for Jan hub + ticker CTA",
      progress: 0.18,
      checkpoint: "Copy review · 10:45",
      stream: "Content",
      icon: "💡",
    },
    {
      id: "mocksmith",
      name: "Mocksmith",
      status: "idle",
      directive: "Prep product mockups + hero banners",
      progress: 0,
      checkpoint: "Brief drop · 11:15",
      stream: "Creative",
      icon: "🎨",
    },
  ],
  objectives: [
    {
      label: "Architect Jan’s Storefront",
      owner: "Draftwright",
      stream: "Build",
      status: "In flight",
    },
    {
      label: "QA forms + checkout",
      owner: "Cellar Sentinel",
      stream: "QA",
      status: "Next",
    },
    {
      label: "Catalog grooming",
      owner: "Cask Scribe",
      stream: "Catalog",
      status: "In flight",
    },
    {
      label: "Hub copy + SEO",
      owner: "Neon Bard",
      stream: "Content",
      status: "In flight",
    },
    {
      label: "Hero visuals",
      owner: "Mocksmith",
      stream: "Creative",
      status: "Blocked",
    },
  ],
  activity: [
    {
      time: "11:02",
      agent: "Draftwright",
      message: "Blueprinted new site map + section assignments",
    },
    {
      time: "10:48",
      agent: "Cask Scribe",
      message: "Normalized catalog tags + variants",
    },
    {
      time: "10:30",
      agent: "Neon Bard",
      message: "Outlined hub hero copy + ticker CTA",
    },
    {
      time: "09:55",
      agent: "Cellar Sentinel",
      message: "QA’d checkout flow on mobile",
    },
    {
      time: "09:10",
      agent: "Mocksmith",
      message: "Queued mockup prompts for beverage merch",
    },
  ],
};
