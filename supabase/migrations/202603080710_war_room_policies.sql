-- Enable row level security and open read access for the War Room tables
alter table if exists public.war_room_agents enable row level security;
alter table if exists public.war_room_objectives enable row level security;
alter table if exists public.war_room_events enable row level security;

drop policy if exists "allow read for war_room_agents" on public.war_room_agents;
create policy "allow read for war_room_agents" on public.war_room_agents
  for select using (true);

drop policy if exists "allow read for war_room_objectives" on public.war_room_objectives;
create policy "allow read for war_room_objectives" on public.war_room_objectives
  for select using (true);

drop policy if exists "allow read for war_room_events" on public.war_room_events;
create policy "allow read for war_room_events" on public.war_room_events
  for select using (true);

-- RPC helper so the UI can fetch all data in one round-trip
create or replace function public.war_room_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  agent_rows jsonb := '[]'::jsonb;
  objective_rows jsonb := '[]'::jsonb;
  event_rows jsonb := '[]'::jsonb;
begin
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'status', status,
      'directive', coalesce(directive, ''),
      'progress', coalesce(progress, 0),
      'checkpoint', coalesce(checkpoint, ''),
      'stream', stream,
      'icon', coalesce(icon, '⚙️')
    ) order by name),
    '[]'::jsonb
  )
  into agent_rows
  from public.war_room_agents;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'label', label,
      'owner', owner,
      'stream', stream,
      'status', status
    ) order by updated_at desc),
    '[]'::jsonb
  )
  into objective_rows
  from public.war_room_objectives;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'occurred_at', occurred_at,
      'agent', agent,
      'message', message
    ) order by occurred_at desc),
    '[]'::jsonb
  )
  into event_rows
  from (
    select occurred_at, agent, message
    from public.war_room_events
    order by occurred_at desc
    limit 20
  ) e;

  return jsonb_build_object(
    'agents', agent_rows,
    'objectives', objective_rows,
    'activity', event_rows
  );
end;
$$;

grant execute on function public.war_room_snapshot() to anon, authenticated;
