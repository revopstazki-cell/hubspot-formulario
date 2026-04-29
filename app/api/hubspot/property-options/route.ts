import { NextRequest, NextResponse } from "next/server";

import { getPropertyOptions } from "@/lib/hubspot";

const ALLOWED_OBJECTS = new Set(["contacts", "deals"]);

export async function GET(request: NextRequest) {
  const objectType = request.nextUrl.searchParams.get("object") ?? "";
  const propertyName = request.nextUrl.searchParams.get("property") ?? "";

  if (!ALLOWED_OBJECTS.has(objectType) || !propertyName) {
    return NextResponse.json(
      {
        success: false,
        error: "Debes enviar object=contacts|deals y property.",
      },
      { status: 400 },
    );
  }

  try {
    const options = await getPropertyOptions(
      objectType as "contacts" | "deals",
      propertyName,
    );

    return NextResponse.json({
      success: true,
      object: objectType,
      property: propertyName,
      options,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos leer las opciones de HubSpot.",
      },
      { status: 500 },
    );
  }
}
