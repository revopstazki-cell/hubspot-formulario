import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("id") ?? searchParams.get("id_de_negocio");

  console.log("Deal ID recibido:", dealId);

  return NextResponse.json({
    success: true,
    dealId,
  });
}
