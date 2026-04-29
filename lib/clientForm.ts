import {
  COBRANZA_ROLE,
  CONTACT_PROPERTY_MAP,
  DEAL_PROPERTY_MAP,
  FACTURACION_ROLE,
  LEGAL_REPRESENTATIVE_ROLE,
} from "@/lib/hubspotProperties";

export type ContactDraft = {
  localId: string;
  selectedContactId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  cargo: string;
  tipoDeContacto: string[];
};

export type ClientFormState = {
  dealId: string;
  linkFichaCliente: string;
  razonSocial: string;
  rutEmpresa: string;
  giroEmpresa: string;
  fechaPublicacionEscritura: string;
  notariaEscrituraPublica: string;
  direccionFacturacion: string;
  comuna: string;
  ciudadEmpresa: string;
  nombreCobranza: string;
  correoCobranza: string;
  telefonoCobranza: string;
  cargoCobranza: string;
  observacionesCobranza: string;
  existePlataformaProveedores: string;
  nombrePlataformaProveedores: string;
  comentarioPlataformaProveedores: string;
  nombreFacturacion: string;
  correoFacturacion: string;
  telefonoFacturacion: string;
  cargoFacturacion: string;
  correoCasillaDTE: string;
  nombreRepresentanteLegal: string;
  rutRepresentanteLegal: string;
  correoRepresentanteLegal: string;
  personeriaArchivo: string;
  requerimientoFacturacion: string[];
  frecuenciaSolicitudOC: string;
  frecuenciaSolicitudMIGO: string;
  frecuenciaSolicitudHES: string;
  frecuenciaSolicitudEDP: string;
  cobranzaContacts: ContactDraft[];
  facturacionContacts: ContactDraft[];
  legalContacts: ContactDraft[];
};

export type HubSpotContactRecord = {
  id: string;
  properties: Record<string, string | null | undefined>;
};

export type HubSpotDealRecord = {
  id: string;
  properties: Record<string, string | null | undefined>;
};

export type ContactSearchResult = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  cargo: string;
  tipoDeContacto: string[];
  tipo_de_contacto?: string[];
};

export function createLocalId() {
  return `contact-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyContactDraft(defaultRoles: string[] = []): ContactDraft {
  return {
    localId: createLocalId(),
    selectedContactId: "",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    cargo: "",
    tipoDeContacto: defaultRoles,
  };
}

export function createEmptyClientFormState(dealId = ""): ClientFormState {
  return {
    dealId,
    linkFichaCliente: "",
    razonSocial: "",
    rutEmpresa: "",
    giroEmpresa: "",
    fechaPublicacionEscritura: "",
    notariaEscrituraPublica: "",
    direccionFacturacion: "",
    comuna: "",
    ciudadEmpresa: "",
    nombreCobranza: "",
    correoCobranza: "",
    telefonoCobranza: "",
    cargoCobranza: "",
    observacionesCobranza: "",
    existePlataformaProveedores: "",
    nombrePlataformaProveedores: "",
    comentarioPlataformaProveedores: "",
    nombreFacturacion: "",
    correoFacturacion: "",
    telefonoFacturacion: "",
    cargoFacturacion: "",
    correoCasillaDTE: "",
    nombreRepresentanteLegal: "",
    rutRepresentanteLegal: "",
    correoRepresentanteLegal: "",
    personeriaArchivo: "",
    requerimientoFacturacion: [],
    frecuenciaSolicitudOC: "",
    frecuenciaSolicitudMIGO: "",
    frecuenciaSolicitudHES: "",
    frecuenciaSolicitudEDP: "",
    cobranzaContacts: [],
    facturacionContacts: [],
    legalContacts: [],
  };
}

export function splitHubSpotMultiValue(value?: string | null) {
  return value
    ? value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function joinHubSpotMultiValue(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join(";");
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstname: "", lastname: "" };
  }

  if (parts.length === 1) {
    return { firstname: parts[0], lastname: "" };
  }

  return {
    firstname: parts[0],
    lastname: parts.slice(1).join(" "),
  };
}

export function getFullName(contact: ContactDraft) {
  return [contact.firstname, contact.lastname].filter(Boolean).join(" ").trim();
}

function hasContactData(contact: ContactDraft) {
  return Boolean(
    contact.selectedContactId ||
      contact.firstname.trim() ||
      contact.lastname.trim() ||
      contact.email.trim() ||
      contact.phone.trim() ||
      contact.cargo.trim() ||
      contact.tipoDeContacto.length > 0,
  );
}

export function mapHubSpotContactToDraft(
  contact: HubSpotContactRecord | ContactSearchResult,
): ContactDraft {
  const properties =
    "properties" in contact
      ? contact.properties
      : {
          firstname: contact.firstname,
          lastname: contact.lastname,
          email: contact.email,
          phone: contact.phone,
          cargo: contact.cargo,
          tipo_de_contacto: joinHubSpotMultiValue(contact.tipoDeContacto),
        };

  return {
    localId: createLocalId(),
    selectedContactId: contact.id,
    firstname: String(properties[CONTACT_PROPERTY_MAP.firstname] ?? ""),
    lastname: String(properties[CONTACT_PROPERTY_MAP.lastname] ?? ""),
    email: String(properties[CONTACT_PROPERTY_MAP.email] ?? ""),
    phone: String(properties[CONTACT_PROPERTY_MAP.phone] ?? ""),
    cargo: String(properties[CONTACT_PROPERTY_MAP.cargo] ?? ""),
    tipoDeContacto: splitHubSpotMultiValue(
      String(properties[CONTACT_PROPERTY_MAP.tipoDeContacto] ?? ""),
    ),
  };
}

function contactFromDealFields(params: {
  fullName: string;
  email: string;
  phone: string;
  cargo: string;
  role: string;
}) {
  const name = splitFullName(params.fullName);

  return {
    ...createEmptyContactDraft([params.role]),
    firstname: name.firstname,
    lastname: name.lastname,
    email: params.email,
    phone: params.phone,
    cargo: params.cargo,
  };
}

function hasRole(contact: ContactDraft, role: string) {
  const compatibleFacturacionRoles = new Set(["Facturacion", FACTURACION_ROLE]);

  if (role === FACTURACION_ROLE) {
    return contact.tipoDeContacto.some((value) =>
      compatibleFacturacionRoles.has(value),
    );
  }

  return contact.tipoDeContacto.includes(role);
}

export function mapHubSpotDealToFormState(
  deal: HubSpotDealRecord,
  associatedContacts: HubSpotContactRecord[] = [],
): ClientFormState {
  const form = createEmptyClientFormState(deal.id);
  const properties = deal.properties;

  for (const [key, propertyName] of Object.entries(DEAL_PROPERTY_MAP)) {
    const value = properties[propertyName];

    if (key === "requerimientoFacturacion") {
      form.requerimientoFacturacion = splitHubSpotMultiValue(String(value ?? ""));
      continue;
    }

    form[key as keyof ClientFormState] = String(value ?? "") as never;
  }

  const contactDrafts = associatedContacts.map(mapHubSpotContactToDraft);
  const cobranzaContacts = contactDrafts.filter((contact) =>
    hasRole(contact, COBRANZA_ROLE),
  );
  const facturacionContacts = contactDrafts.filter((contact) =>
    hasRole(contact, FACTURACION_ROLE),
  );
  const legalContacts = contactDrafts.filter((contact) =>
    hasRole(contact, LEGAL_REPRESENTATIVE_ROLE),
  );

  const legacyCobranzaContact = contactFromDealFields({
    fullName: form.nombreCobranza,
    email: form.correoCobranza,
    phone: form.telefonoCobranza,
    cargo: form.cargoCobranza,
    role: COBRANZA_ROLE,
  });
  const legacyFacturacionContact = contactFromDealFields({
    fullName: form.nombreFacturacion,
    email: form.correoFacturacion,
    phone: form.telefonoFacturacion,
    cargo: form.cargoFacturacion,
    role: FACTURACION_ROLE,
  });
  const legacyLegalContact = contactFromDealFields({
    fullName: form.nombreRepresentanteLegal,
    email: form.correoRepresentanteLegal,
    phone: "",
    cargo: "",
    role: LEGAL_REPRESENTATIVE_ROLE,
  });

  form.cobranzaContacts =
    cobranzaContacts.length > 0
      ? cobranzaContacts
      : hasContactData(legacyCobranzaContact)
        ? [legacyCobranzaContact]
        : [];

  form.facturacionContacts =
    facturacionContacts.length > 0
      ? facturacionContacts
      : hasContactData(legacyFacturacionContact)
        ? [legacyFacturacionContact]
        : [];

  form.legalContacts =
    legalContacts.length > 0
      ? legalContacts
      : hasContactData(legacyLegalContact)
        ? [legacyLegalContact]
        : [];

  return withPrimaryContactDealFields(form);
}

export function withPrimaryContactDealFields(form: ClientFormState) {
  const cobranza = form.cobranzaContacts[0];
  const facturacion = form.facturacionContacts[0];
  const legal = form.legalContacts[0];

  return {
    ...form,
    nombreCobranza: cobranza ? getFullName(cobranza) : form.nombreCobranza,
    correoCobranza: cobranza?.email ?? form.correoCobranza,
    telefonoCobranza: cobranza?.phone ?? form.telefonoCobranza,
    cargoCobranza: cobranza?.cargo ?? form.cargoCobranza,
    nombreFacturacion: facturacion
      ? getFullName(facturacion)
      : form.nombreFacturacion,
    correoFacturacion: facturacion?.email ?? form.correoFacturacion,
    telefonoFacturacion: facturacion?.phone ?? form.telefonoFacturacion,
    cargoFacturacion: facturacion?.cargo ?? form.cargoFacturacion,
    nombreRepresentanteLegal: legal
      ? getFullName(legal)
      : form.nombreRepresentanteLegal,
    correoRepresentanteLegal: legal?.email ?? form.correoRepresentanteLegal,
  };
}

export function cleanObject<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== undefined && value !== null && value !== "";
    }),
  ) as Partial<T>;
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "").trim();
}

export function normalizeContactPayload(contact: ContactDraft) {
  return {
    ...contact,
    firstname: normalizeText(contact.firstname),
    lastname: normalizeText(contact.lastname),
    email: normalizeText(contact.email),
    phone: normalizePhone(contact.phone),
    cargo: normalizeText(contact.cargo),
    tipoDeContacto: contact.tipoDeContacto
      .map(normalizeText)
      .filter(Boolean),
  };
}

export function normalizeDealPayload(form: ClientFormState) {
  const normalizedForm = withPrimaryContactDealFields(form);
  const selectedRequirements = normalizedForm.requerimientoFacturacion;

  return cleanObject({
    [DEAL_PROPERTY_MAP.linkFichaCliente]: normalizeText(
      normalizedForm.linkFichaCliente,
    ),
    [DEAL_PROPERTY_MAP.razonSocial]: normalizeText(normalizedForm.razonSocial),
    [DEAL_PROPERTY_MAP.rutEmpresa]: normalizeText(normalizedForm.rutEmpresa),
    [DEAL_PROPERTY_MAP.giroEmpresa]: normalizeText(normalizedForm.giroEmpresa),
    [DEAL_PROPERTY_MAP.fechaPublicacionEscritura]:
      normalizedForm.fechaPublicacionEscritura,
    [DEAL_PROPERTY_MAP.notariaEscrituraPublica]:
      normalizeText(normalizedForm.notariaEscrituraPublica),
    [DEAL_PROPERTY_MAP.direccionFacturacion]:
      normalizeText(normalizedForm.direccionFacturacion),
    [DEAL_PROPERTY_MAP.comuna]: normalizeText(normalizedForm.comuna),
    [DEAL_PROPERTY_MAP.ciudadEmpresa]: normalizeText(
      normalizedForm.ciudadEmpresa,
    ),
    [DEAL_PROPERTY_MAP.nombreCobranza]: normalizeText(
      normalizedForm.nombreCobranza,
    ),
    [DEAL_PROPERTY_MAP.correoCobranza]: normalizeText(
      normalizedForm.correoCobranza,
    ),
    [DEAL_PROPERTY_MAP.telefonoCobranza]: normalizePhone(
      normalizedForm.telefonoCobranza,
    ),
    [DEAL_PROPERTY_MAP.cargoCobranza]: normalizeText(
      normalizedForm.cargoCobranza,
    ),
    [DEAL_PROPERTY_MAP.observacionesCobranza]:
      normalizeText(normalizedForm.observacionesCobranza),
    [DEAL_PROPERTY_MAP.existePlataformaProveedores]:
      normalizeText(normalizedForm.existePlataformaProveedores),
    [DEAL_PROPERTY_MAP.nombrePlataformaProveedores]: normalizeText(
      normalizedForm.nombrePlataformaProveedores,
    ),
    [DEAL_PROPERTY_MAP.comentarioPlataformaProveedores]: normalizeText(
      normalizedForm.comentarioPlataformaProveedores,
    ),
    [DEAL_PROPERTY_MAP.nombreFacturacion]: normalizeText(
      normalizedForm.nombreFacturacion,
    ),
    [DEAL_PROPERTY_MAP.correoFacturacion]: normalizeText(
      normalizedForm.correoFacturacion,
    ),
    [DEAL_PROPERTY_MAP.telefonoFacturacion]:
      normalizePhone(normalizedForm.telefonoFacturacion),
    [DEAL_PROPERTY_MAP.cargoFacturacion]: normalizeText(
      normalizedForm.cargoFacturacion,
    ),
    [DEAL_PROPERTY_MAP.correoCasillaDTE]: normalizeText(
      normalizedForm.correoCasillaDTE,
    ),
    [DEAL_PROPERTY_MAP.nombreRepresentanteLegal]:
      normalizeText(normalizedForm.nombreRepresentanteLegal),
    [DEAL_PROPERTY_MAP.rutRepresentanteLegal]:
      normalizeText(normalizedForm.rutRepresentanteLegal),
    [DEAL_PROPERTY_MAP.correoRepresentanteLegal]:
      normalizeText(normalizedForm.correoRepresentanteLegal),
    [DEAL_PROPERTY_MAP.requerimientoFacturacion]: joinHubSpotMultiValue(
      selectedRequirements.map(normalizeText).filter(Boolean),
    ),
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudOC]: normalizeText(
      normalizedForm.frecuenciaSolicitudOC,
    ),
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudMIGO]: normalizeText(
      normalizedForm.frecuenciaSolicitudMIGO,
    ),
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudHES]: normalizeText(
      normalizedForm.frecuenciaSolicitudHES,
    ),
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudEDP]: normalizeText(
      normalizedForm.frecuenciaSolicitudEDP,
    ),
  });
}

export function getDealUpdatePayload(form: ClientFormState) {
  return normalizeDealPayload(form);
}
