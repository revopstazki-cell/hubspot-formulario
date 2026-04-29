import {
  cleanObject,
  joinHubSpotMultiValue,
  normalizeContactPayload,
  splitHubSpotMultiValue,
  type ContactDraft,
  type ContactSearchResult,
  type HubSpotContactRecord,
  type HubSpotDealRecord,
} from "@/lib/clientForm";
import {
  CONTACT_PROPERTIES,
  CONTACT_PROPERTY_MAP,
  DEAL_PROPERTIES,
  type PropertyOption,
} from "@/lib/hubspotProperties";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_FILE_FOLDER = "/tazki/ficha-cliente";

type HubSpotFetchOptions = RequestInit & {
  isMultipart?: boolean;
};

type HubSpotFileUploadResult = {
  id: string;
  url?: string;
  defaultHostingUrl?: string;
};

type HubSpotPropertyResponse = {
  label: string;
  name: string;
  type: string;
  fieldType: string;
  options?: Array<{
    label: string;
    value: string;
    hidden?: boolean;
    displayOrder?: number;
  }>;
};

export function getHubSpotToken() {
  return process.env.HUBSPOT_PRIVATE_APP_TOKEN ?? "";
}

function getHubSpotHeaders(isMultipart = false) {
  const token = getHubSpotToken();

  if (!token) {
    throw new Error("Falta HUBSPOT_PRIVATE_APP_TOKEN en las variables de entorno.");
  }

  return {
    Authorization: `Bearer ${token}`,
    ...(isMultipart ? {} : { "Content-Type": "application/json" }),
  };
}

async function parseHubSpotResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let data: unknown = null;

  if (text && contentType.toLowerCase().includes("application/json")) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "HubSpot devolvió un error.";
    const details = data ? JSON.stringify(data) : "";

    throw new Error([message, details].filter(Boolean).join(" "));
  }

  if (text && !contentType.toLowerCase().includes("application/json")) {
    throw new Error("HubSpot no devolvió una respuesta válida.");
  }

  return data;
}

async function hubspotFetch<T = unknown>(
  path: string,
  options: HubSpotFetchOptions = {},
) {
  const response = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHubSpotHeaders(options.isMultipart),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  return (await parseHubSpotResponse(response)) as T;
}

export async function getDealById(dealId: string) {
  const query = new URLSearchParams({
    properties: DEAL_PROPERTIES.join(","),
    associations: "contacts",
  });

  const deal = await hubspotFetch<{
    id: string;
    properties: Record<string, string | null | undefined>;
    associations?: {
      contacts?: {
        results: Array<{ id: string }>;
      };
    };
  }>(`/crm/v3/objects/deals/${dealId}?${query.toString()}`);

  const associatedContactIds =
    deal.associations?.contacts?.results.map((contact) => contact.id) ?? [];

  const associatedContacts =
    associatedContactIds.length > 0
      ? await getContactsBatchByIds(associatedContactIds)
      : [];

  return {
    deal: {
      id: deal.id,
      properties: deal.properties,
    } satisfies HubSpotDealRecord,
    associatedContacts,
  };
}

export async function getContactById(contactId: string) {
  const query = new URLSearchParams({
    properties: CONTACT_PROPERTIES.join(","),
  });

  const contact = await hubspotFetch<{
    id: string;
    properties: Record<string, string | null | undefined>;
  }>(`/crm/v3/objects/contacts/${contactId}?${query.toString()}`);

  return {
    id: contact.id,
    properties: contact.properties,
  } satisfies HubSpotContactRecord;
}

export async function getPropertyOptions(
  objectType: "contacts" | "deals",
  propertyName: string,
) {
  const property = await getPropertyDefinition(objectType, propertyName);

  return (property.options ?? [])
    .filter((option) => !option.hidden)
    .sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0))
    .map<PropertyOption>((option) => ({
      label: option.label,
      value: option.value,
    }));
}

export async function getPropertyDefinition(
  objectType: "contacts" | "deals",
  propertyName: string,
) {
  return hubspotFetch<HubSpotPropertyResponse>(
    `/crm/v3/properties/${objectType}/${propertyName}`,
  );
}

export async function searchContacts(query: string) {
  const response = await hubspotFetch<{
    results: Array<{
      id: string;
      properties: Record<string, string | null | undefined>;
    }>;
  }>("/crm/v3/objects/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      limit: 8,
      properties: CONTACT_PROPERTIES,
    }),
  });

  return response.results.map<ContactSearchResult>((contact) => ({
    id: contact.id,
    firstname: String(contact.properties[CONTACT_PROPERTY_MAP.firstname] ?? ""),
    lastname: String(contact.properties[CONTACT_PROPERTY_MAP.lastname] ?? ""),
    email: String(contact.properties[CONTACT_PROPERTY_MAP.email] ?? ""),
    phone: String(contact.properties[CONTACT_PROPERTY_MAP.phone] ?? ""),
    cargo: String(contact.properties[CONTACT_PROPERTY_MAP.cargo] ?? ""),
    observaciones: String(
      contact.properties[CONTACT_PROPERTY_MAP.observaciones] ?? "",
    ),
    rutRepresentanteLegal: String(
      contact.properties[CONTACT_PROPERTY_MAP.rutRepresentanteLegal] ?? "",
    ),
    tipoDeContacto: splitHubSpotMultiValue(
      String(contact.properties[CONTACT_PROPERTY_MAP.tipoDeContacto] ?? ""),
    ),
    tipo_de_contacto: splitHubSpotMultiValue(
      String(contact.properties[CONTACT_PROPERTY_MAP.tipoDeContacto] ?? ""),
    ),
  }));
}

export async function updateDeal(dealId: string, properties: Record<string, string>) {
  const cleaned = cleanObject(properties);

  if (Object.keys(cleaned).length === 0) {
    return null;
  }

  return hubspotFetch(`/crm/v3/objects/deals/${dealId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: cleaned,
    }),
  });
}

export async function uploadFileToHubSpot(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "options",
    JSON.stringify({
      access: "PUBLIC_NOT_INDEXABLE",
    }),
  );
  formData.append("folderPath", HUBSPOT_FILE_FOLDER);
  formData.append("fileName", file.name);

  return hubspotFetch<HubSpotFileUploadResult>("/files/v3/files", {
    method: "POST",
    body: formData,
    isMultipart: true,
  });
}

async function getContactsBatchByIds(contactIds: string[]) {
  const response = await hubspotFetch<{
    results: Array<{
      id: string;
      properties: Record<string, string | null | undefined>;
    }>;
  }>("/crm/v3/objects/contacts/batch/read", {
    method: "POST",
    body: JSON.stringify({
      properties: CONTACT_PROPERTIES,
      inputs: contactIds.map((id) => ({ id })),
    }),
  });

  return response.results.map<HubSpotContactRecord>((contact) => ({
    id: contact.id,
    properties: contact.properties,
  }));
}

async function getContactByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const response = await hubspotFetch<{
    results: Array<{
      id: string;
      properties: Record<string, string | null | undefined>;
    }>;
  }>("/crm/v3/objects/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: CONTACT_PROPERTY_MAP.email,
              operator: "EQ",
              value: normalizedEmail,
            },
          ],
        },
      ],
      limit: 1,
      properties: CONTACT_PROPERTIES,
    }),
  });

  const contact = response.results[0];

  if (!contact) {
    return null;
  }

  return {
    id: contact.id,
    properties: contact.properties,
  } satisfies HubSpotContactRecord;
}

function getContactPropertiesPayload(
  contact: ContactDraft,
  dealId: string,
  roles: string[],
  options: { includeEmptyValues?: boolean } = {},
) {
  const normalizedContact = normalizeContactPayload(contact);
  const properties = {
    [CONTACT_PROPERTY_MAP.firstname]: normalizedContact.firstname,
    [CONTACT_PROPERTY_MAP.lastname]: normalizedContact.lastname,
    [CONTACT_PROPERTY_MAP.email]: normalizedContact.email,
    [CONTACT_PROPERTY_MAP.phone]: normalizedContact.phone,
    [CONTACT_PROPERTY_MAP.cargo]: normalizedContact.cargo,
    ...(normalizedContact.observaciones
      ? { [CONTACT_PROPERTY_MAP.observaciones]: normalizedContact.observaciones }
      : {}),
    [CONTACT_PROPERTY_MAP.rutRepresentanteLegal]:
      normalizedContact.rutRepresentanteLegal,
    [CONTACT_PROPERTY_MAP.idDeNegocio]: dealId,
    [CONTACT_PROPERTY_MAP.tipoDeContacto]: joinHubSpotMultiValue(roles),
  };

  if (options.includeEmptyValues) {
    return cleanObject(properties);
  }

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value.trim() !== ""),
  );
}

async function createContact(properties: Record<string, string>) {
  const response = await hubspotFetch<{
    id: string;
    properties: Record<string, string | null | undefined>;
  }>("/crm/v3/objects/contacts", {
    method: "POST",
    body: JSON.stringify({ properties }),
  });

  return {
    id: response.id,
    properties: response.properties,
  } satisfies HubSpotContactRecord;
}

async function updateContact(contactId: string, properties: Record<string, string>) {
  const cleaned = cleanObject(properties);

  if (Object.keys(cleaned).length === 0) {
    return null;
  }

  return hubspotFetch(`/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: cleaned,
    }),
  });
}

export async function associateContactToDeal(contactId: string, dealId: string) {
  return hubspotFetch(
    `/crm/v4/objects/contact/${contactId}/associations/default/deal/${dealId}`,
    {
      method: "PUT",
    },
  );
}

async function resolveExistingContact(contact: ContactDraft) {
  if (contact.selectedContactId) {
    return getContactById(contact.selectedContactId);
  }

  if (contact.email) {
    return getContactByEmail(contact.email);
  }

  return null;
}

export async function upsertContactForDeal(params: {
  contact: ContactDraft;
  dealId: string;
  mergeRoles?: boolean;
}) {
  const { contact, dealId, mergeRoles = false } = params;
  const normalizedContact = normalizeContactPayload(contact);
  const existing = await resolveExistingContact(contact);
  const roles = normalizedContact.tipoDeContacto;

  const mergedRoles =
    mergeRoles && existing
      ? Array.from(
          new Set([
            ...splitHubSpotMultiValue(
              String(existing.properties[CONTACT_PROPERTY_MAP.tipoDeContacto] ?? ""),
            ),
            ...roles,
          ]),
        )
      : roles;

  if (existing) {
    const properties = getContactPropertiesPayload(
      normalizedContact,
      dealId,
      mergedRoles,
      { includeEmptyValues: true },
    );
    await updateContact(existing.id, properties);
    await associateContactToDeal(existing.id, dealId);

    return {
      id: existing.id,
      created: false,
      roles: mergedRoles,
    };
  }

  if (!normalizedContact.email) {
    throw new Error(
      "No se puede crear un contacto nuevo sin correo. Selecciona uno existente o agrega email.",
    );
  }

  const created = await createContact(
    getContactPropertiesPayload(normalizedContact, dealId, mergedRoles, {
      includeEmptyValues: false,
    }),
  );
  await associateContactToDeal(created.id, dealId);

  return {
    id: created.id,
    created: true,
    roles: mergedRoles,
  };
}

export function getPersoneriaDealValue(upload: HubSpotFileUploadResult) {
  return String(upload.id || upload.url || upload.defaultHostingUrl || "");
}

export async function getPersoneriaDealValueForProperty(
  upload: HubSpotFileUploadResult,
) {
  const property = await getPropertyDefinition("deals", "personeria_");

  if (property.fieldType === "file") {
    return String(upload.id);
  }

  return String(upload.url || upload.defaultHostingUrl || upload.id || "");
}
