import { NextResponse } from "next/server";

import {
  normalizeDealPayload,
  withPrimaryContactDealFields,
  type ClientFormState,
} from "@/lib/clientForm";
import {
  EMAIL_FORMAT_ERROR,
  GENERAL_SAVE_ERROR,
  PHONE_FORMAT_ERROR,
  RUT_FORMAT_ERROR,
} from "@/lib/formErrors";
import {
  getPersoneriaDealValueForProperty,
  updateDeal,
  uploadFileToHubSpot,
  upsertContactForDeal,
} from "@/lib/hubspot";
import {
  CONTACT_PROPERTY_MAP,
  DEAL_PROPERTY_MAP,
} from "@/lib/hubspotProperties";

export const runtime = "nodejs";

function mapErrorToFieldErrors(error: unknown, payload: ClientFormState | null) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const fieldErrors: Record<string, string> = {};

  if (message.includes(DEAL_PROPERTY_MAP.rutEmpresa)) {
    fieldErrors.rutEmpresa = RUT_FORMAT_ERROR;
  }

  if (message.includes(CONTACT_PROPERTY_MAP.rutRepresentanteLegal)) {
    payload?.legalContacts.forEach((_, index) => {
      fieldErrors[`legalContacts.${index}.rutRepresentanteLegal`] =
        RUT_FORMAT_ERROR;
    });
  }

  if (message.includes("email") || message.includes("correo")) {
    for (const key of [
      "cobranzaContacts",
      "facturacionContacts",
      "legalContacts",
    ] as const) {
      payload?.[key].forEach((contact, index) => {
        if (contact.email.trim()) {
          fieldErrors[`${key}.${index}.email`] = EMAIL_FORMAT_ERROR;
        }
      });
    }
  }

  if (message.includes("phone") || message.includes("telefono")) {
    for (const key of [
      "cobranzaContacts",
      "facturacionContacts",
      "legalContacts",
    ] as const) {
      payload?.[key].forEach((contact, index) => {
        if (contact.phone.trim()) {
          fieldErrors[`${key}.${index}.phone`] = PHONE_FORMAT_ERROR;
        }
      });
    }
  }

  return fieldErrors;
}

export async function POST(request: Request) {
  let payload: ClientFormState | null = null;

  try {
    const formData = await request.formData();
    const payloadRaw = formData.get("payload");
    const personeriaFile = formData.get("personeriaFile");

    if (typeof payloadRaw !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: GENERAL_SAVE_ERROR,
        },
        { status: 400 },
      );
    }

    payload = withPrimaryContactDealFields(
      JSON.parse(payloadRaw) as ClientFormState,
    );

    if (!payload.dealId) {
      return NextResponse.json(
        {
          success: false,
          error: GENERAL_SAVE_ERROR,
        },
        { status: 400 },
      );
    }

    const dealProperties: Record<string, string> = {
      ...normalizeDealPayload(payload),
    };

    if (personeriaFile instanceof File && personeriaFile.size > 0) {
      const upload = await uploadFileToHubSpot(personeriaFile);
      dealProperties[DEAL_PROPERTY_MAP.personeriaArchivo] =
        await getPersoneriaDealValueForProperty(upload);
    }

    await updateDeal(payload.dealId, dealProperties);

    const allContacts = [
      ...payload.cobranzaContacts,
      ...payload.facturacionContacts,
      ...payload.legalContacts,
    ];

    for (const contact of allContacts) {
      if (!contact.selectedContactId && !contact.email.trim()) {
        continue;
      }

      await upsertContactForDeal({
        contact,
        dealId: payload.dealId,
        mergeRoles: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Ficha de cliente enviada correctamente",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: GENERAL_SAVE_ERROR,
        fieldErrors: mapErrorToFieldErrors(error, payload),
      },
      { status: 500 },
    );
  }
}
