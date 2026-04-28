import { NextRequest, NextResponse } from "next/server";
import { mapHubSpotDealToFormState } from "@/lib/clientForm";
import { getDealById } from "@/lib/hubspot";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("id") ?? searchParams.get("id_de_negocio");

  if (!dealId) {
    return NextResponse.json(
      {
        success: false,
        error: "Falta el ID del negocio.",
      },
      { status: 400 },
    );
  }

  try {
    const { deal, associatedContacts } = await getDealById(dealId);

    return NextResponse.json({
      success: true,
      dealId,
      deal,
      associatedContacts,
      formData: mapHubSpotDealToFormState(deal, associatedContacts),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos leer el deal desde HubSpot.",
      },
      { status: 500 },
    );
  }
}
