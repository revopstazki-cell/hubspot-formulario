import { NextResponse } from "next/server";

import {
  buildLegalRepresentativeContactDraft,
  getDealUpdatePayload,
  withPrimaryContactDealFields,
  type ClientFormState,
} from "@/lib/clientForm";
import {
  getPersoneriaDealValue,
  updateDeal,
  uploadFileToHubSpot,
  upsertContactForDeal,
} from "@/lib/hubspot";
import {
  COBRANZA_ROLE,
  DEAL_PROPERTY_MAP,
  FACTURACION_ROLE,
} from "@/lib/hubspotProperties";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payloadRaw = formData.get("payload");
    const personeriaFile = formData.get("personeriaFile");

    if (typeof payloadRaw !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "No recibimos el payload del formulario.",
        },
        { status: 400 },
      );
    }

    const payload = withPrimaryContactDealFields(
      JSON.parse(payloadRaw) as ClientFormState,
    );

    if (!payload.dealId) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta el ID del negocio.",
        },
        { status: 400 },
      );
    }

    const dealProperties: Record<string, string> = {
      ...getDealUpdatePayload(payload),
    };

    if (personeriaFile instanceof File && personeriaFile.size > 0) {
      const upload = await uploadFileToHubSpot(personeriaFile);
      dealProperties[DEAL_PROPERTY_MAP.personeriaArchivo] =
        getPersoneriaDealValue(upload);
    }

    await updateDeal(payload.dealId, dealProperties);

    const representative = buildLegalRepresentativeContactDraft(payload);
    await upsertContactForDeal({
      contact: representative,
      dealId: payload.dealId,
      roles: representative.tipoDeContacto,
      mergeRoles: true,
    });

    for (const contact of payload.cobranzaContacts) {
      if (!contact.firstname.trim() && !contact.selectedContactId && !contact.email.trim()) {
        continue;
      }

      await upsertContactForDeal({
        contact,
        dealId: payload.dealId,
        roles: [COBRANZA_ROLE],
        mergeRoles: true,
      });
    }

    for (const contact of payload.facturacionContacts) {
      if (!contact.firstname.trim() && !contact.selectedContactId && !contact.email.trim()) {
        continue;
      }

      await upsertContactForDeal({
        contact,
        dealId: payload.dealId,
        roles: [FACTURACION_ROLE],
        mergeRoles: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Ficha de cliente enviada correctamente",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar la ficha de cliente.",
      },
      { status: 500 },
    );
  }
}
