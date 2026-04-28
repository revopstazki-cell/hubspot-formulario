import { NextRequest, NextResponse } from "next/server";

import { searchContacts } from "@/lib/hubspot";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({
      success: true,
      results: [],
    });
  }

  try {
    const results = await searchContacts(query);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos buscar contactos en HubSpot.",
      },
      { status: 500 },
    );
  }
}
