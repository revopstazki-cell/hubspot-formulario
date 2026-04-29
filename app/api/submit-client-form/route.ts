import { NextResponse } from "next/server";

import {
  getFirstContactForDealSummary,
  getFullName,
  normalizeDealPayload,
  withPrimaryContactDealFields,
  type ClientFormState,
  type ContactDraft,
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

const FECHA_INSCRIPCION_FICHA_CLIENTE_PROPERTY =
  "feccha_inscripcion_ficha_cliente";

const DEAL_ERROR_FIELD_MAP: Record<string, string> = {
  [DEAL_PROPERTY_MAP.razonSocial]: "razonSocial",
  [DEAL_PROPERTY_MAP.rutEmpresa]: "rutEmpresa",
  [DEAL_PROPERTY_MAP.giroEmpresa]: "giroEmpresa",
  [DEAL_PROPERTY_MAP.fechaPublicacionEscritura]: "fechaPublicacionEscritura",
  [DEAL_PROPERTY_MAP.notariaEscrituraPublica]: "notariaEscrituraPublica",
  [DEAL_PROPERTY_MAP.direccionFacturacion]: "direccionFacturacion",
  [DEAL_PROPERTY_MAP.comuna]: "comuna",
  [DEAL_PROPERTY_MAP.ciudadEmpresa]: "ciudadEmpresa",
  [DEAL_PROPERTY_MAP.nombreCobranza]: "nombreCobranza",
  [DEAL_PROPERTY_MAP.correoCobranza]: "correoCobranza",
  [DEAL_PROPERTY_MAP.telefonoCobranza]: "telefonoCobranza",
  [DEAL_PROPERTY_MAP.cargoCobranza]: "cargoCobranza",
  [DEAL_PROPERTY_MAP.observacionesCobranza]: "observacionesCobranza",
  [DEAL_PROPERTY_MAP.existePlataformaProveedores]:
    "existePlataformaProveedores",
  [DEAL_PROPERTY_MAP.nombrePlataformaProveedores]:
    "nombrePlataformaProveedores",
  [DEAL_PROPERTY_MAP.comentarioPlataformaProveedores]:
    "comentarioPlataformaProveedores",
  [DEAL_PROPERTY_MAP.nombreFacturacion]: "nombreFacturacion",
  [DEAL_PROPERTY_MAP.correoFacturacion]: "correoFacturacion",
  [DEAL_PROPERTY_MAP.telefonoFacturacion]: "telefonoFacturacion",
  [DEAL_PROPERTY_MAP.cargoFacturacion]: "cargoFacturacion",
  [DEAL_PROPERTY_MAP.correoCasillaDTE]: "correoCasillaDTE",
  [DEAL_PROPERTY_MAP.nombreRepresentanteLegal]: "nombreRepresentanteLegal",
  [DEAL_PROPERTY_MAP.rutRepresentanteLegal]: "rutRepresentanteLegal",
  [DEAL_PROPERTY_MAP.correoRepresentanteLegal]: "correoRepresentanteLegal",
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
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    sectionKey === "cobranzaContacts" &&
    message.includes(CONTACT_PROPERTY_MAP.observaciones)
  ) {
    return {
      observacionesCobranza: FIELD_REVIEW_ERROR,
    };
  }

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

type ContactSection = {
  key: ContactSectionKey;
  contacts: ClientFormState[ContactSectionKey];
};

type ContactUpsertItem = {
  contact: ContactDraft;
  sectionKey: ContactSectionKey;
  contactIndex: number;
};

function contactDedupeKey(contact: ContactDraft, fallback: string) {
  if (contact.selectedContactId.trim()) {
    return `id:${contact.selectedContactId.trim()}`;
  }

  if (contact.email.trim()) {
    return `email:${contact.email.trim().toLowerCase()}`;
  }

  return fallback;
}

function mergeTextValue(currentValue: string, nextValue: string) {
  return currentValue.trim() ? currentValue : nextValue;
}

function mergeContactDraft(
  currentContact: ContactDraft,
  nextContact: ContactDraft,
) {
  return {
    ...currentContact,
    selectedContactId: mergeTextValue(
      currentContact.selectedContactId,
      nextContact.selectedContactId,
    ),
    firstname: mergeTextValue(currentContact.firstname, nextContact.firstname),
    lastname: mergeTextValue(currentContact.lastname, nextContact.lastname),
    email: mergeTextValue(currentContact.email, nextContact.email),
    phone: mergeTextValue(currentContact.phone, nextContact.phone),
    cargo: mergeTextValue(currentContact.cargo, nextContact.cargo),
    observaciones: mergeTextValue(
      currentContact.observaciones,
      nextContact.observaciones,
    ),
    rutRepresentanteLegal: mergeTextValue(
      currentContact.rutRepresentanteLegal,
      nextContact.rutRepresentanteLegal,
    ),
    tipoDeContacto: Array.from(
      new Set([
        ...currentContact.tipoDeContacto,
        ...nextContact.tipoDeContacto,
      ].filter(Boolean)),
    ),
  };
}

function getUniqueContactsToUpsert(sections: ContactSection[]) {
  const contactsByKey = new Map<string, ContactUpsertItem>();

  for (const section of sections) {
    for (const [index, contact] of section.contacts.entries()) {
      if (!contact.selectedContactId.trim() && !contact.email.trim()) {
        continue;
      }

      const key = contactDedupeKey(
        contact,
        `${section.key}:${contact.localId || index}`,
      );
      const existing = contactsByKey.get(key);

      if (!existing) {
        contactsByKey.set(key, {
          contact,
          sectionKey: section.key,
          contactIndex: index,
        });
        continue;
      }

      contactsByKey.set(key, {
        ...existing,
        contact: mergeContactDraft(existing.contact, contact),
      });
    }
  }

  return Array.from(contactsByKey.values());
}

function withCobranzaObservacionesOnPrimaryContact(form: ClientFormState) {
  const primaryContact = getFirstContactForDealSummary(form.cobranzaContacts);

  if (!primaryContact) {
    return form;
  }

  return {
    ...form,
    cobranzaContacts: form.cobranzaContacts.map((contact) =>
      contact.localId === primaryContact.localId
        ? {
            ...contact,
            observaciones: form.observacionesCobranza,
          }
        : contact,
    ),
  };
}

function contactLogSummary(contact?: ContactDraft) {
  if (!contact) {
    return null;
  }

  return {
    contactId: contact.selectedContactId || null,
    email: contact.email || null,
    name: getFullName(contact) || null,
    roles: contact.tipoDeContacto,
  };
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
      withCobranzaObservacionesOnPrimaryContact(
        JSON.parse(payloadRaw) as ClientFormState,
      ),
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

    const contactSections: ContactSection[] = [
      {
        key: "cobranzaContacts",
        contacts: payload.cobranzaContacts,
      },
      {
        key: "facturacionContacts",
        contacts: payload.facturacionContacts,
      },
      {
        key: "legalContacts",
        contacts: payload.legalContacts,
      },
    ];

    console.log("[submit-client-form] contactos recibidos por sección", {
      cobranza: payload.cobranzaContacts.length,
      facturacion: payload.facturacionContacts.length,
      representanteLegal: payload.legalContacts.length,
    });
    console.log("[submit-client-form] contactos usados para resumen del deal", {
      cobranza: contactLogSummary(
        getFirstContactForDealSummary(payload.cobranzaContacts),
      ),
      facturacion: contactLogSummary(
        getFirstContactForDealSummary(payload.facturacionContacts),
      ),
      representanteLegal: contactLogSummary(
        getFirstContactForDealSummary(payload.legalContacts),
      ),
    });

    const uniqueContacts = getUniqueContactsToUpsert(contactSections);
    console.log("[submit-client-form] contactos únicos a guardar/asociar", {
      total: uniqueContacts.length,
      contacts: uniqueContacts.map((item) => ({
        section: item.sectionKey,
        index: item.contactIndex,
        ...contactLogSummary(item.contact),
      })),
    });

    for (const item of uniqueContacts) {
      try {
        await upsertContactForDeal({
          contact: item.contact,
          dealId: payload.dealId,
          mergeRoles: true,
        });
      } catch (error) {
        console.error(error);

        return errorResponse(
          mapContactErrorToFieldErrors(
            error,
            payload,
            item.sectionKey,
            item.contactIndex,
          ),
        );
      }
    }

    const dealProperties: Record<string, string> = {
      ...normalizeDealPayload(payload),
    };
    const now = new Date().toISOString();
    dealProperties[FECHA_INSCRIPCION_FICHA_CLIENTE_PROPERTY] = now;

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

    console.log("[submit-client-form] payload final del deal", dealProperties);

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
