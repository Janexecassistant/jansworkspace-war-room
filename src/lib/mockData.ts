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
      id: "store-architect",
      name: "Store Architect",
      status: "running",
      directive: "Plan site structure, own sections, maintain build checklist",
      progress: 0.64,
      checkpoint: "Checklist sync · 11:30",
      stream: "Build",
      icon: "🧱",
    },
    {
      id: "qa-operator",
      name: "QA Operator",
      status: "running",
      directive: "Click-through QA for nav, forms, checkout",
      progress: 0.18,
      checkpoint: "QA sweep · 13:00",
      stream: "QA",
      icon: "🛰️",
    },
    {
      id: "catalog-curator",
      name: "Catalog Curator",
      status: "running",
      directive: "Clean titles, descriptions, tags, variant data",
      progress: 0.44,
      checkpoint: "Catalog push · 10:15",
      stream: "Catalog",
      icon: "✍️",
    },
    {
      id: "content-strategist",
      name: "Content Strategist",
      status: "running",
      directive: "Draft microcopy for Jan 1.2 hub and live tickers",
      progress: 0.22,
      checkpoint: "Copy review · 10:45",
      stream: "Content",
      icon: "💡",
    },
    {
      id: "creative-director",
      name: "Creative Director",
      status: "idle",
      directive: "Produce product mockups, hero banners, ad concepts",
      progress: 0,
      checkpoint: "Brief drop · 11:15",
      stream: "Creative",
      icon: "🎨",
    },
  ],
  objectives: [
    {
      label: "Architect Jan’s Storefront",
      owner: "Store Architect",
      stream: "Build",
      status: "In flight",
    },
    {
      label: "QA forms + checkout",
      owner: "QA Operator",
      stream: "QA",
      status: "Next",
    },
    {
      label: "Catalog grooming",
      owner: "Catalog Curator",
      stream: "Catalog",
      status: "In flight",
    },
    {
      label: "Hub copy + SEO",
      owner: "Content Strategist",
      stream: "Content",
      status: "In flight",
    },
    {
      label: "Hero visuals",
      owner: "Creative Director",
      stream: "Creative",
      status: "Blocked",
    },
  ],
  activity: [
    {
      time: "11:02",
      agent: "Store Architect",
      message: "Blueprinted new site map + section assignments",
    },
    {
      time: "10:48",
      agent: "Catalog Curator",
      message: "Normalized catalog tags + variants",
    },
    {
      time: "10:30",
      agent: "Content Strategist",
      message: "Outlined hub hero copy + ticker CTA",
    },
    {
      time: "09:55",
      agent: "QA Operator",
      message: "QA’d checkout flow on mobile",
    },
    {
      time: "09:10",
      agent: "Creative Director",
      message: "Queued mockup prompts for beverage merch",
    },
  ],
};
