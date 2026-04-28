import { NextResponse } from "next/server";
import { getHubSpotToken } from "@/lib/hubspot";

export async function GET() {
  const token = getHubSpotToken();

  return NextResponse.json({
    success: true,
    hasToken: Boolean(token),
  });
}
