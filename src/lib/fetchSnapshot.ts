import { supabase } from "./supabase";
import { pgPool } from "./postgres";
import { mockSnapshot, type WarRoomSnapshot } from "./mockData";

type AgentRow = {
  id: string;
  name: string;
  status: string;
  directive: string | null;
  progress: number | null;
  checkpoint: string | null;
  stream: string;
  icon: string | null;
};

type ObjectiveRow = {
  id: string;
  label: string;
  owner: string;
  stream: string;
  status: string;
};

type EventRow = {
  occurred_at: string;
  agent: string;
  message: string;
};

type RpcSnapshot = {
  agents?: AgentRow[];
  objectives?: ObjectiveRow[];
  activity?: EventRow[];
};

function mapAgents(rows: AgentRow[]): WarRoomSnapshot["agents"] {
  return rows.map((agent) => ({
    id: agent.id,
    name: agent.name,
    status: (agent.status as WarRoomSnapshot["agents"][number]["status"]) ?? "idle",
    directive: agent.directive ?? "",
    progress: agent.progress ?? 0,
    checkpoint: agent.checkpoint ?? "",
    stream: (agent.stream as WarRoomSnapshot["agents"][number]["stream"]) ?? "Ops",
    icon: agent.icon ?? "⚙️",
  }));
}

function mapObjectives(rows: ObjectiveRow[]): WarRoomSnapshot["objectives"] {
  return rows.map((objective) => ({
    label: objective.label,
    owner: objective.owner,
    stream: (objective.stream as WarRoomSnapshot["objectives"][number]["stream"]) ?? "Product",
    status: (objective.status as WarRoomSnapshot["objectives"][number]["status"]) ?? "Next",
  }));
}

function mapEvents(rows: EventRow[]): WarRoomSnapshot["activity"] {
  return rows.map((event) => ({
    time: new Date(event.occurred_at).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }),
    agent: event.agent,
    message: event.message,
  }));
}

function normalizeRpcSnapshot(payload: RpcSnapshot | null): WarRoomSnapshot | null {
  if (!payload) return null;
  if (!Array.isArray(payload.agents) || !Array.isArray(payload.objectives) || !Array.isArray(payload.activity)) {
    return null;
  }

  return {
    agents: mapAgents(payload.agents),
    objectives: mapObjectives(payload.objectives),
    activity: mapEvents(payload.activity),
  };
}

async function fetchFromPostgres(): Promise<WarRoomSnapshot | null> {
  if (!pgPool) return null;
  const client = await pgPool.connect();
  try {
    const [agentRes, objectiveRes, eventRes] = await Promise.all([
      client.query<AgentRow>(
        "select id, name, status, directive, progress, checkpoint, stream, icon from public.war_room_agents order by name"
      ),
      client.query<ObjectiveRow>(
        "select id, label, owner, stream, status from public.war_room_objectives order by updated_at desc"
      ),
      client.query<EventRow>(
        "select occurred_at, agent, message from public.war_room_events order by occurred_at desc limit 20"
      ),
    ]);

    return {
      agents: mapAgents(agentRes.rows),
      objectives: mapObjectives(objectiveRes.rows),
      activity: mapEvents(eventRes.rows),
    };
  } catch (error) {
    console.error("Failed to read War Room snapshot via Postgres", error);
    return null;
  } finally {
    client.release();
  }
}

export async function fetchSnapshot(): Promise<WarRoomSnapshot> {
  if (supabase) {
    const { data: rpcData } = await supabase.rpc("war_room_snapshot");
    const rpcSnapshot = normalizeRpcSnapshot((rpcData as RpcSnapshot | null) ?? null);
    if (rpcSnapshot) {
      return rpcSnapshot;
    }

    const [agentRes, objectiveRes, activityRes] = await Promise.all([
      supabase.from("war_room_agents").select("*"),
      supabase.from("war_room_objectives").select("*").order("updated_at", { ascending: false }),
      supabase
        .from("war_room_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(20),
    ]);

    if (!agentRes.error && !objectiveRes.error && !activityRes.error) {
      return {
        agents: mapAgents((agentRes.data as AgentRow[]) ?? []),
        objectives: mapObjectives((objectiveRes.data as ObjectiveRow[]) ?? []),
        activity: mapEvents((activityRes.data as EventRow[]) ?? []),
      };
    }
  }

  const pgSnapshot = await fetchFromPostgres();
  if (pgSnapshot) {
    return pgSnapshot;
  }

  return mockSnapshot;
}
