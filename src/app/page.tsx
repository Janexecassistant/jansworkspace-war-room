import { fetchSnapshot } from "@/lib/fetchSnapshot";
import type { AgentCard } from "@/lib/mockData";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  running: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  idle: "border-emerald-500/30 bg-emerald-500/5 text-emerald-200",
  blocked: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const streamPills: Record<string, string> = {
  Product: "bg-blue-500/15 text-blue-200",
  Ops: "bg-lime-500/10 text-lime-200",
  Comms: "bg-pink-500/15 text-pink-200",
  Infra: "bg-cyan-500/15 text-cyan-200",
};

function formatNow() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(now);
}

const statusLabel = {
  running: "RUNNING",
  idle: "IDLE",
  blocked: "BLOCKED",
};

function getStatusBadge(status: string) {
  const key = status as keyof typeof statusStyles;
  return statusStyles[key] ?? "border-white/10 bg-white/5 text-white";
}

function getStreamPill(stream: AgentCard["stream"]) {
  return streamPills[stream] ?? "bg-white/10";
}

export default async function WarRoom() {
  const snapshot = await fetchSnapshot();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05010f] via-[#070c1b] to-black text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/5/30 px-6 py-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-amber-200">
                War Room · Live Ops Board
              </p>
              <h1 className="text-3xl font-semibold text-white">Agent telemetry</h1>
            </div>
            <div className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
              Heartbeat nominal · {formatNow()} ET
            </div>
          </div>
          <p className="text-sm text-slate-300 lg:max-w-3xl">
            Transparency snapshot for Merch on Tap + future builds. Every tile tracks a named agent, their current directive, and when they’ll surface next.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {snapshot.agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-3xl border border-white/5 bg-white/5/10 p-5 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                          {agent.stream}
                        </p>
                        <h2 className="text-xl font-semibold text-white">
                          {agent.name}
                        </h2>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(agent.status)}`}
                    >
                      {statusLabel[agent.status as keyof typeof statusLabel] ?? agent.status}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-200">{agent.directive}</p>
                  <div className="mt-5">
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200"
                        style={{ width: `${Math.min(agent.progress, 1) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{Math.round(agent.progress * 100)}%</span>
                      <span>{agent.checkpoint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/5/10 px-6 py-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Direction map
                  </p>
                  <h3 className="text-lg font-semibold text-white">What the crew is driving</h3>
                </div>
                <span className="text-xs text-slate-400">Updated hourly</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {snapshot.objectives.map((objective) => (
                  <div
                    key={objective.label}
                    className="rounded-2xl border border-white/5 bg-white/5/20 p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{objective.stream}</span>
                      <span>{objective.status}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {objective.label}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs">
                      <span className="text-slate-300">Lead</span>
                      <span className={`rounded-full px-3 py-1 ${getStreamPill(objective.stream)}`}>
                        {objective.owner}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-white/5/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Activity ticker
                </p>
                <h3 className="text-lg font-semibold text-white">Live feed</h3>
              </div>
              <span className="text-xs text-slate-400">Last 5 entries</span>
            </div>
            <div className="mt-4 h-96 space-y-4 overflow-y-auto pr-2 text-sm">
              {snapshot.activity.map((event, index) => (
                <div
                  key={`${event.time}-${index}`}
                  className="rounded-2xl border border-white/5 bg-white/5/15 p-4"
                >
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
