'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentCard, WarRoomSnapshot } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

const statusStyles: Record<string, string> = {
  running: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  idle: "border-emerald-500/30 bg-emerald-500/5 text-emerald-200",
  blocked: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const streamPills: Record<string, string> = {
  Build: "bg-blue-500/15 text-blue-200",
  QA: "bg-emerald-500/15 text-emerald-200",
  Catalog: "bg-amber-500/15 text-amber-200",
  Content: "bg-pink-500/15 text-pink-200",
  Creative: "bg-purple-500/15 text-purple-200",
};

const roleDescriptions: Record<AgentCard["stream"], string> = {
  Build: "Primary: Store architecture + build",
  QA: "Primary: Browser QA + regression",
  Catalog: "Primary: Product catalog & data",
  Content: "Primary: Content + SEO",
  Creative: "Primary: Visuals & mockups",
};

const statusLabel = {
  running: "RUNNING",
  idle: "IDLE",
  blocked: "BLOCKED",
};

type AgentActivityEntry = {
  time: string;
  message: string;
  iso?: string;
};

type Props = {
  initialSnapshot: WarRoomSnapshot;
};

export function WarRoomSurface({ initialSnapshot }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applySnapshot = useCallback((data: WarRoomSnapshot | null) => {
    if (!data) return;
    setSnapshot(data);
    setLastUpdated(new Date());
  }, []);

  const fetchLatestSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as WarRoomSnapshot;
    } catch (error) {
      console.error('Failed to refresh snapshot', error);
      return null;
    }
  }, []);

  const refreshSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchLatestSnapshot();
      applySnapshot(data);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchLatestSnapshot, applySnapshot]);

  const lastDirectiveLabel = snapshot.lastDirective ? `${formatTime(new Date(snapshot.lastDirective))} ET` : "Awaiting signal";

  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;

    const pullSnapshot = async () => {
      const data = await fetchLatestSnapshot();
      applySnapshot(data);
    };

    const scheduleRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(pullSnapshot, 600);
    };

    if (supabase) {
      const channel = supabase
        .channel("war-room-feed")
        .on("postgres_changes", { event: "*", schema: "public", table: "war_room_events" }, scheduleRefresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "war_room_agents" }, scheduleRefresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "war_room_objectives" }, scheduleRefresh)
        .subscribe();

      return () => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        supabase?.removeChannel(channel);
      };
    }

    const fallbackInterval = setInterval(pullSnapshot, 15000);
    return () => {
      clearInterval(fallbackInterval);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [fetchLatestSnapshot, applySnapshot]);

  const orbitNodes = useMemo(() => buildOrbit(snapshot), [snapshot]);
  const globalTicker = useMemo(() => {
    const entries = snapshot.activity.slice(0, 5);
    if (entries.length) return entries;
    return [
      {
        time: formatTime(new Date()),
        agent: "War Room",
        message: "Standing by",
        iso: new Date().toISOString(),
      },
    ];
  }, [snapshot]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03010b] via-[#05050f] to-black text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/5 bg-white/5/20 px-6 py-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-amber-200">War Room · Live Ops Board</p>
              <h1 className="text-3xl font-semibold text-white">Agent telemetry</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
                Synced · {formatTime(lastUpdated)} ET
              </div>
              <button
                onClick={refreshSnapshot}
                disabled={isRefreshing}
                className="rounded-full border border-white/15 bg-white/5/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40 disabled:opacity-60"
              >
                {isRefreshing ? "Refreshing…" : "Refresh now"}
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-300 lg:max-w-3xl">
            Transparency snapshot for Merch on Tap + future builds. Every tile tracks a named agent, their current directive, and when they’ll surface next.
          </p>
        </header>

        <section className="lg:hidden flex min-h-[360px] flex-col items-center justify-center space-y-6 rounded-[2rem] border border-white/5 bg-white/5/15 px-6 py-8 text-center">
          <div className="relative flex w-full items-center justify-center py-8">
            <CommanderCore active={snapshot.directorActive} label={lastDirectiveLabel} />
          </div>
          <p className="text-xs text-slate-300">Tap the refresh pill above any time you need the latest directive.</p>
          <div className="w-full overflow-hidden rounded-full border border-white/5 bg-white/5/20 px-3 py-2">
            <div className="ticker-row whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-slate-200">
              {globalTicker.map((item, idx) => (
                <span key={`mobile-ticker-${item.iso ?? idx}`}>
                  {item.time} · {item.agent} · {item.message}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative hidden h-[720px] overflow-hidden rounded-[46px] border border-white/10 bg-gradient-to-b from-white/5/10 via-transparent to-white/5/10 p-6 lg:block">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wire-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            {orbitNodes.map((node) => (
              <line
                key={`wire-${node.agent.id}`}
                x1="50"
                y1="50"
                x2={node.coordX.toFixed(2)}
                y2={node.coordY.toFixed(2)}
                stroke={node.agent.status === "running" ? "url(#wire-active)" : "rgba(255,255,255,0.15)"}
                strokeWidth={node.agent.status === "running" ? 1.2 : 0.5}
                strokeLinecap="round"
                strokeDasharray={node.agent.status === "running" ? "6" : undefined}
                className={node.agent.status === "running" ? "wire-active" : ""}
              />
            ))}
          </svg>

          <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

          <div className="commander-core-anchor">
            <CommanderCore active={snapshot.directorActive} label={lastDirectiveLabel} />
          </div>

          {orbitNodes.map((node) => (
            <div
              key={node.agent.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.positionX}%`, top: `${node.positionY}%` }}
            >
              <AgentCardBlock agent={node.agent} activity={node.activityLog} />
            </div>
          ))}
        </section>

        <section className="space-y-4 lg:hidden">
          {snapshot.agents.map((agent) => (
            <AgentCardBlock
              key={`mobile-${agent.id}`}
              agent={agent}
              activity={buildAgentActivity(agent, snapshot.activity)}
              size="full"
            />
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] border border-white/5 bg-white/5/15 px-6 py-6 backdrop-blur lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Direction map</p>
                <h3 className="text-lg font-semibold text-white">What the crew is driving</h3>
              </div>
              <span className="text-xs text-slate-400">Updated hourly</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {snapshot.objectives.map((objective) => (
                <div key={objective.label} className="rounded-3xl border border-white/5 bg-white/5/20 p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{objective.stream}</span>
                    <span>{objective.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{objective.label}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs">
                    <span className="text-slate-300">Lead</span>
                    <span className={`rounded-full px-3 py-1 ${getStreamPill(objective.stream)}`}>
                      {objective.owner}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/5 bg-white/5/15 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Activity ticker</p>
                <h3 className="text-lg font-semibold text-white">Live feed</h3>
              </div>
              <span className="text-xs text-slate-400">Last 5 entries</span>
            </div>
            <div className="mt-4 h-[28rem] space-y-4 overflow-y-auto pr-2 text-sm">
              {snapshot.activity.map((event, index) => (
                <div key={`${event.time}-${index}`} className="rounded-3xl border border-white/5 bg-white/5/20 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{event.time}</span>
                    <span>{event.agent}</span>
                  </div>
                  <p className="mt-2 text-slate-100">{event.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function buildOrbit(snapshot: WarRoomSnapshot) {
  const total = Math.max(snapshot.agents.length, 1);
  const angleStep = (Math.PI * 2) / total;
  const radius = 34;

  return snapshot.agents.map((agent, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const coordX = 50 + Math.cos(angle) * radius;
    const coordY = 50 + Math.sin(angle) * radius;

    return {
      agent,
      coordX,
      coordY,
      positionX: coordX,
      positionY: coordY,
      activityLog: buildAgentActivity(agent, snapshot.activity),
    };
  });
}

function buildAgentActivity(agent: AgentCard, activity: WarRoomSnapshot["activity"]): AgentActivityEntry[] {
  const entries = activity.filter((event) => event.agent === agent.name).slice(0, 3);
  const now = new Date();
  const directiveText = agent.directive?.trim() ? agent.directive : "Standing by";
  const nextText = agent.checkpoint?.trim() ? `Next: ${agent.checkpoint}` : null;
  const liveEntry: AgentActivityEntry = {
    time: `Live · ${formatTime(now)}`,
    message: nextText ? `${directiveText} → ${nextText}` : directiveText,
    iso: now.toISOString(),
  };

  return [liveEntry, ...entries].slice(0, 3);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
  }).format(date);
}

type AgentCardBlockProps = {
  agent: AgentCard;
  activity: AgentActivityEntry[];
  size?: "compact" | "full";
};

function AgentCardBlock({ agent, activity, size = "compact" }: AgentCardBlockProps) {
  const cardWidth = size === "compact" ? "w-56 sm:w-64" : "w-full";
  const roleText = roleDescriptions[agent.stream] ?? `Primary: ${agent.stream}`;
  const activityFeed = activity.length ? activity : [{ time: formatTime(new Date()), message: agent.directive, iso: new Date().toISOString() }];

  return (
    <div className={`${cardWidth} rounded-3xl border border-white/10 bg-black/40 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{agent.stream}</p>
            <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
            <p className="text-[11px] text-slate-400">{roleText}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusBadge(agent.status)}`}
        >
          {statusLabel[agent.status as keyof typeof statusLabel] ?? agent.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-200">{agent.directive}</p>
      <div className="mt-4">
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200"
            style={{ width: `${Math.min(agent.progress, 1) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{Math.round(Math.min(agent.progress, 1) * 100)}%</span>
          <span>{agent.checkpoint}</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5/30 p-3">
        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Latest activity</p>
        <div className="mt-2 space-y-2 text-xs text-slate-100">
          {activityFeed.slice(0, 3).map((entry, idx) => (
            <div key={`${agent.id}-activity-${entry.iso ?? idx}`}>
              <p className="text-[11px] text-slate-400">{entry.time}</p>
              <p>{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type CommanderCoreProps = {
  active: boolean;
  label: string;
};

function CommanderCore({ active, label }: CommanderCoreProps) {
  return (
    <div
      className={`commander-core relative flex h-56 w-56 items-center justify-center rounded-full border border-sky-400/60 bg-gradient-to-b from-[#031a32] via-[#040d1f] to-[#010409] text-center shadow-[0_0_90px_rgba(56,189,248,0.45)] ${
        active ? "commander-core--active" : "commander-core--idle"
      }`}
    >
      <span className="commander-core__pulse commander-core__pulse--outer" aria-hidden="true" />
      <span className="commander-core__pulse commander-core__pulse--inner" aria-hidden="true" />
      <svg viewBox="0 0 120 120" className="commander-core__brain" role="presentation" aria-hidden="true">
        <defs>
          <radialGradient id="commander-brain-core" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#60a5fa" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.65" />
          </radialGradient>
          <linearGradient id="commander-brain-wave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path
          className="commander-core__brain-shell"
          d="M60 12c-16 0-30 12-30 28 0 8.5 3.3 15.2 8.8 20.4-3.4 4.3-5.2 9.4-5.2 15.2 0 13.5 12.5 24.4 26.4 24.4h8c13.9 0 26.4-10.9 26.4-24.4 0-5.8-1.8-10.9-5.2-15.2 5.5-5.2 8.8-11.9 8.8-20.4 0-16-14-28-30-28z"
          fill="url(#commander-brain-core)"
        />
        <path className="commander-core__brain-lobe commander-core__brain-lobe--left" d="M58 24c-11 0-20 8-20 19 0 6.7 3 12.3 9.5 16.6-5 3.6-8.3 9.5-8.3 16.6 0 11.3 9.5 19.8 20.8 19.8" fill="none" />
        <path className="commander-core__brain-lobe commander-core__brain-lobe--right" d="M62 24c11 0 20 8 20 19 0 6.7-3 12.3-9.5 16.6 5 3.6 8.3 9.5 8.3 16.6 0 11.3-9.5 19.8-20.8 19.8" fill="none" />
        <path className="commander-core__brain-seam" d="M60 26v68" fill="none" />
        <path className="commander-core__brain-fold" d="M46 42c-6 3.5-10 8.5-10 14.8 0 7.5 5.4 13.5 12.5 15.8" fill="none" />
        <path className="commander-core__brain-fold commander-core__brain-fold--right" d="M74 42c6 3.5 10 8.5 10 14.8 0 7.5-5.4 13.5-12.5 15.8" fill="none" />
        <path className="commander-core__brain-wave commander-core__brain-wave--one" d="M34 60c6-4 15-7 26-7s20 3 26 7" fill="none" />
        <path className="commander-core__brain-wave commander-core__brain-wave--two" d="M38 73c7-4 12-6 22-6s15 2 22 6" fill="none" />
        <path className="commander-core__brain-spark commander-core__brain-spark--one" d="M32 54c10-10 20-12 32-8" fill="none" />
        <path className="commander-core__brain-spark commander-core__brain-spark--two" d="M44 82c-4 2-7 5-9 10" fill="none" />
        <path className="commander-core__brain-spark commander-core__brain-spark--three" d="M76 78c6 4 12 6 20 2" fill="none" />
      </svg>
      <div className="commander-core__badge">
        <span className="commander-core__callsign">Jan</span>
        <span className="commander-core__version">1.2</span>
      </div>
      <div className="commander-core__status">
        <span className="commander-core__state">{active ? "Signal live" : "Standby link"}</span>
        <span className="commander-core__timestamp">{label}</span>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const key = status as keyof typeof statusStyles;
  return statusStyles[key] ?? "border-white/10 bg-white/5 text-white";
}

function getStreamPill(stream: AgentCard["stream"]) {
  return streamPills[stream] ?? "bg-white/10";
}
