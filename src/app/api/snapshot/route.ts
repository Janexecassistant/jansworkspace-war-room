import { NextResponse } from "next/server";
import { fetchSnapshot } from "@/lib/fetchSnapshot";

export const revalidate = 0;

export async function GET() {
  const snapshot = await fetchSnapshot();
  return NextResponse.json(snapshot);
}
