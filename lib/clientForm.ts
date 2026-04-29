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
    cobranzaContacts: [createEmptyContactDraft([COBRANZA_ROLE])],
    facturacionContacts: [createEmptyContactDraft([FACTURACION_ROLE])],
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

  form.cobranzaContacts =
    cobranzaContacts.length > 0
      ? cobranzaContacts
      : [
          contactFromDealFields({
            fullName: form.nombreCobranza,
            email: form.correoCobranza,
            phone: form.telefonoCobranza,
            cargo: form.cargoCobranza,
            role: COBRANZA_ROLE,
          }),
        ];

  form.facturacionContacts =
    facturacionContacts.length > 0
      ? facturacionContacts
      : [
          contactFromDealFields({
            fullName: form.nombreFacturacion,
            email: form.correoFacturacion,
            phone: form.telefonoFacturacion,
            cargo: form.cargoFacturacion,
            role: FACTURACION_ROLE,
          }),
        ];

  return withPrimaryContactDealFields(form);
}

export function withPrimaryContactDealFields(form: ClientFormState) {
  const cobranza = form.cobranzaContacts[0];
  const facturacion = form.facturacionContacts[0];

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

export function getDealUpdatePayload(form: ClientFormState) {
  const normalizedForm = withPrimaryContactDealFields(form);

  return cleanObject({
    [DEAL_PROPERTY_MAP.linkFichaCliente]: normalizedForm.linkFichaCliente,
    [DEAL_PROPERTY_MAP.razonSocial]: normalizedForm.razonSocial,
    [DEAL_PROPERTY_MAP.rutEmpresa]: normalizedForm.rutEmpresa,
    [DEAL_PROPERTY_MAP.giroEmpresa]: normalizedForm.giroEmpresa,
    [DEAL_PROPERTY_MAP.fechaPublicacionEscritura]:
      normalizedForm.fechaPublicacionEscritura,
    [DEAL_PROPERTY_MAP.notariaEscrituraPublica]:
      normalizedForm.notariaEscrituraPublica,
    [DEAL_PROPERTY_MAP.direccionFacturacion]:
      normalizedForm.direccionFacturacion,
    [DEAL_PROPERTY_MAP.comuna]: normalizedForm.comuna,
    [DEAL_PROPERTY_MAP.ciudadEmpresa]: normalizedForm.ciudadEmpresa,
    [DEAL_PROPERTY_MAP.nombreCobranza]: normalizedForm.nombreCobranza,
    [DEAL_PROPERTY_MAP.correoCobranza]: normalizedForm.correoCobranza,
    [DEAL_PROPERTY_MAP.telefonoCobranza]: normalizedForm.telefonoCobranza,
    [DEAL_PROPERTY_MAP.cargoCobranza]: normalizedForm.cargoCobranza,
    [DEAL_PROPERTY_MAP.observacionesCobranza]:
      normalizedForm.observacionesCobranza,
    [DEAL_PROPERTY_MAP.existePlataformaProveedores]:
      normalizedForm.existePlataformaProveedores,
    [DEAL_PROPERTY_MAP.nombrePlataformaProveedores]:
      normalizedForm.nombrePlataformaProveedores,
    [DEAL_PROPERTY_MAP.comentarioPlataformaProveedores]:
      normalizedForm.comentarioPlataformaProveedores,
    [DEAL_PROPERTY_MAP.nombreFacturacion]: normalizedForm.nombreFacturacion,
    [DEAL_PROPERTY_MAP.correoFacturacion]: normalizedForm.correoFacturacion,
    [DEAL_PROPERTY_MAP.telefonoFacturacion]:
      normalizedForm.telefonoFacturacion,
    [DEAL_PROPERTY_MAP.cargoFacturacion]: normalizedForm.cargoFacturacion,
    [DEAL_PROPERTY_MAP.correoCasillaDTE]: normalizedForm.correoCasillaDTE,
    [DEAL_PROPERTY_MAP.nombreRepresentanteLegal]:
      normalizedForm.nombreRepresentanteLegal,
    [DEAL_PROPERTY_MAP.rutRepresentanteLegal]:
      normalizedForm.rutRepresentanteLegal,
    [DEAL_PROPERTY_MAP.correoRepresentanteLegal]:
      normalizedForm.correoRepresentanteLegal,
    [DEAL_PROPERTY_MAP.requerimientoFacturacion]: joinHubSpotMultiValue(
      normalizedForm.requerimientoFacturacion,
    ),
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudOC]:
      normalizedForm.frecuenciaSolicitudOC,
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudMIGO]:
      normalizedForm.frecuenciaSolicitudMIGO,
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudHES]:
      normalizedForm.frecuenciaSolicitudHES,
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudEDP]:
      normalizedForm.frecuenciaSolicitudEDP,
  });
}

export function buildLegalRepresentativeContactDraft(form: ClientFormState) {
  const representanteName = splitFullName(form.nombreRepresentanteLegal);

  return {
    localId: "derived-representante",
    selectedContactId: "",
    firstname: representanteName.firstname,
    lastname: representanteName.lastname,
    email: form.correoRepresentanteLegal,
    phone: "",
    cargo: "",
    tipoDeContacto: [LEGAL_REPRESENTATIVE_ROLE],
  } satisfies ContactDraft;
}
