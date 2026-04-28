import { NextResponse } from "next/server";

import { getContactById } from "@/lib/hubspot";

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: string };
  const contactId = body.id?.trim();

  if (!contactId) {
    return NextResponse.json(
      {
        success: false,
        error: "Falta el ID del contacto.",
      },
      { status: 400 },
    );
  }

  try {
    const contact = await getContactById(contactId);

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos leer el contacto desde HubSpot.",
      },
      { status: 500 },
    );
  }
}
