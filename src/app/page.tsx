import { fetchSnapshot } from "@/lib/fetchSnapshot";
import { WarRoomSurface } from "@/components/WarRoomSurface";

export const dynamic = "force-dynamic";

export default async function WarRoom() {
  const snapshot = await fetchSnapshot();
  return <WarRoomSurface initialSnapshot={snapshot} />;
}
