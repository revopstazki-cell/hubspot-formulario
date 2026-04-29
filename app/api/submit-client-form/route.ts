import { NextResponse } from "next/server";

import {
  normalizeDealPayload,
  withPrimaryContactDealFields,
  type ClientFormState,
} from "@/lib/clientForm";
import {
  CONTACT_SAVE_ERROR,
  EMAIL_FORMAT_ERROR,
  FIELD_REVIEW_ERROR,
  FILE_UPLOAD_ERROR,
  FORM_SAVE_ERROR,
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

type ContactSectionKey =
  | "cobranzaContacts"
  | "facturacionContacts"
  | "legalContacts";

const DEAL_ERROR_FIELD_MAP: Record<string, string> = {
  [DEAL_PROPERTY_MAP.razonSocial]: "razonSocial",
  [DEAL_PROPERTY_MAP.rutEmpresa]: "rutEmpresa",
  [DEAL_PROPERTY_MAP.giroEmpresa]: "giroEmpresa",
  [DEAL_PROPERTY_MAP.fechaPublicacionEscritura]: "fechaPublicacionEscritura",
  [DEAL_PROPERTY_MAP.notariaEscrituraPublica]: "notariaEscrituraPublica",
  [DEAL_PROPERTY_MAP.direccionFacturacion]: "direccionFacturacion",
  [DEAL_PROPERTY_MAP.comuna]: "comuna",
  [DEAL_PROPERTY_MAP.ciudadEmpresa]: "ciudadEmpresa",
  [DEAL_PROPERTY_MAP.existePlataformaProveedores]:
    "existePlataformaProveedores",
  [DEAL_PROPERTY_MAP.nombrePlataformaProveedores]:
    "nombrePlataformaProveedores",
  [DEAL_PROPERTY_MAP.comentarioPlataformaProveedores]:
    "comentarioPlataformaProveedores",
  [DEAL_PROPERTY_MAP.correoCasillaDTE]: "correoCasillaDTE",
  [DEAL_PROPERTY_MAP.personeriaArchivo]: "personeriaFile",
  [DEAL_PROPERTY_MAP.requerimientoFacturacion]: "requerimientoFacturacion",
  [DEAL_PROPERTY_MAP.frecuenciaSolicitudOC]: "frecuenciaSolicitudOC",
  [DEAL_PROPERTY_MAP.frecuenciaSolicitudMIGO]: "frecuenciaSolicitudMIGO",
  [DEAL_PROPERTY_MAP.frecuenciaSolicitudHES]: "frecuenciaSolicitudHES",
  [DEAL_PROPERTY_MAP.frecuenciaSolicitudEDP]: "frecuenciaSolicitudEDP",
};

const CONTACT_ERROR_FIELD_MAP: Record<string, string> = {
  [CONTACT_PROPERTY_MAP.firstname]: "firstname",
  [CONTACT_PROPERTY_MAP.lastname]: "lastname",
  [CONTACT_PROPERTY_MAP.email]: "email",
  [CONTACT_PROPERTY_MAP.phone]: "phone",
  [CONTACT_PROPERTY_MAP.cargo]: "cargo",
  [CONTACT_PROPERTY_MAP.tipoDeContacto]: "tipoDeContacto",
  [CONTACT_PROPERTY_MAP.rutRepresentanteLegal]: "rutRepresentanteLegal",
};

function getMessageForProperty(propertyName: string) {
  if (
    propertyName === DEAL_PROPERTY_MAP.rutEmpresa ||
    propertyName === CONTACT_PROPERTY_MAP.rutRepresentanteLegal
  ) {
    return RUT_FORMAT_ERROR;
  }

  if (
    propertyName === CONTACT_PROPERTY_MAP.email ||
    propertyName.includes("correo")
  ) {
    return EMAIL_FORMAT_ERROR;
  }

  if (
    propertyName === CONTACT_PROPERTY_MAP.phone ||
    propertyName.includes("telefono")
  ) {
    return PHONE_FORMAT_ERROR;
  }

  return FIELD_REVIEW_ERROR;
}

function mapErrorToFieldErrors(error: unknown, payload: ClientFormState | null) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const fieldErrors: Record<string, string> = {};

  for (const [propertyName, fieldName] of Object.entries(DEAL_ERROR_FIELD_MAP)) {
    if (message.includes(propertyName)) {
      fieldErrors[fieldName] = getMessageForProperty(propertyName);
    }
  }

  for (const [propertyName, fieldName] of Object.entries(
    CONTACT_ERROR_FIELD_MAP,
  )) {
    if (!message.includes(propertyName)) {
      continue;
    }

    for (const key of [
      "cobranzaContacts",
      "facturacionContacts",
      "legalContacts",
    ] as const) {
      payload?.[key].forEach((contact, index) => {
        if (
          propertyName === CONTACT_PROPERTY_MAP.rutRepresentanteLegal &&
          key !== "legalContacts"
        ) {
          return;
        }

        fieldErrors[`${key}.${index}.${fieldName}`] =
          getMessageForProperty(propertyName);
      });
    }
  }

  return fieldErrors;
}

function mapContactErrorToFieldErrors(
  error: unknown,
  payload: ClientFormState | null,
  sectionKey: ContactSectionKey,
  contactIndex: number,
) {
  const mappedErrors = mapErrorToFieldErrors(error, payload);
  const contextPrefix = `${sectionKey}.${contactIndex}.`;
  const contextualErrors = Object.fromEntries(
    Object.entries(mappedErrors).filter(([key]) => key.startsWith(contextPrefix)),
  );

  if (Object.keys(contextualErrors).length > 0) {
    return contextualErrors;
  }

  return {
    [`${sectionKey}.${contactIndex}.email`]: CONTACT_SAVE_ERROR,
  };
}

function errorResponse(fieldErrors: Record<string, string>) {
  return NextResponse.json(
    {
      success: false,
      error: GENERAL_SAVE_ERROR,
      fieldErrors,
    },
    { status: 500 },
  );
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

    try {
      if (personeriaFile instanceof File && personeriaFile.size > 0) {
        const upload = await uploadFileToHubSpot(personeriaFile);
        dealProperties[DEAL_PROPERTY_MAP.personeriaArchivo] =
          await getPersoneriaDealValueForProperty(upload);
      }
    } catch (error) {
      console.error(error);

      return errorResponse({
        personeriaFile: FILE_UPLOAD_ERROR,
      });
    }

    try {
      await updateDeal(payload.dealId, dealProperties);
    } catch (error) {
      console.error(error);

      const fieldErrors = mapErrorToFieldErrors(error, payload);

      return errorResponse(
        Object.keys(fieldErrors).length > 0
          ? fieldErrors
          : { formSave: FORM_SAVE_ERROR },
      );
    }

    const contactSections: Array<{
      key: ContactSectionKey;
      contacts: ClientFormState[ContactSectionKey];
    }> = [
      { key: "cobranzaContacts", contacts: payload.cobranzaContacts },
      { key: "facturacionContacts", contacts: payload.facturacionContacts },
      { key: "legalContacts", contacts: payload.legalContacts },
    ];

    for (const section of contactSections) {
      for (const [index, contact] of section.contacts.entries()) {
        if (!contact.selectedContactId && !contact.email.trim()) {
          continue;
        }

        try {
          await upsertContactForDeal({
            contact,
            dealId: payload.dealId,
            mergeRoles: true,
          });
        } catch (error) {
          console.error(error);

          return errorResponse(
            mapContactErrorToFieldErrors(error, payload, section.key, index),
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ficha de cliente enviada correctamente",
    });
  } catch (error) {
    console.error(error);

    const fieldErrors = mapErrorToFieldErrors(error, payload);

    return errorResponse(
      Object.keys(fieldErrors).length > 0
        ? fieldErrors
        : { formSave: FORM_SAVE_ERROR },
    );
  }
}
