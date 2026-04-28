import {
  CONTACT_PROPERTY_MAP,
  DEAL_PROPERTY_MAP,
  RESPONSABLE_IT_ROLE,
} from "@/lib/hubspotProperties";

export type ContactDraft = {
  localId: string;
  selectedContactId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  jobtitle: string;
  cargo: string;
  observaciones: string;
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
  responsablesIT: ContactDraft[];
  stakeholders: ContactDraft[];
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
  jobtitle: string;
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
    jobtitle: "",
    cargo: "",
    observaciones: "",
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
    responsablesIT: [createEmptyContactDraft([RESPONSABLE_IT_ROLE])],
    stakeholders: [createEmptyContactDraft()],
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
          jobtitle: contact.jobtitle,
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
    jobtitle: String(properties[CONTACT_PROPERTY_MAP.jobtitle] ?? ""),
    cargo: String(properties[CONTACT_PROPERTY_MAP.cargo] ?? ""),
    observaciones: String(properties[CONTACT_PROPERTY_MAP.observaciones] ?? ""),
    tipoDeContacto: splitHubSpotMultiValue(
      String(properties[CONTACT_PROPERTY_MAP.tipoDeContacto] ?? ""),
    ),
  };
}

export function mapHubSpotDealToFormState(
  deal: HubSpotDealRecord,
  associatedContacts: HubSpotContactRecord[] = [],
): ClientFormState {
  const form = createEmptyClientFormState(deal.id);
  const properties = deal.properties;
  const derivedOnlyRoles = new Set([
    "Cobranza/Proveedores",
    "Facturacion",
    "Representante Legal",
  ]);

  for (const [key, propertyName] of Object.entries(DEAL_PROPERTY_MAP)) {
    const value = properties[propertyName];

    if (key === "requerimientoFacturacion") {
      form.requerimientoFacturacion = splitHubSpotMultiValue(String(value ?? ""));
      continue;
    }

    form[key as keyof ClientFormState] = String(value ?? "") as never;
  }

  const responsablesIT = associatedContacts
    .map(mapHubSpotContactToDraft)
    .filter((contact) => {
      const roles = contact.tipoDeContacto;
      return roles.includes(RESPONSABLE_IT_ROLE) && roles.length === 1;
    });

  const stakeholders = associatedContacts
    .map(mapHubSpotContactToDraft)
    .filter((contact) => {
      const roles = contact.tipoDeContacto;
      return (
        roles.length > 0 &&
        !roles.every((role) => derivedOnlyRoles.has(role)) &&
        !(roles.includes(RESPONSABLE_IT_ROLE) && roles.length === 1)
      );
    });

  if (responsablesIT.length > 0) {
    form.responsablesIT = responsablesIT;
  }

  if (stakeholders.length > 0) {
    form.stakeholders = stakeholders;
  }

  return form;
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
  return cleanObject({
    [DEAL_PROPERTY_MAP.linkFichaCliente]: form.linkFichaCliente,
    [DEAL_PROPERTY_MAP.razonSocial]: form.razonSocial,
    [DEAL_PROPERTY_MAP.rutEmpresa]: form.rutEmpresa,
    [DEAL_PROPERTY_MAP.giroEmpresa]: form.giroEmpresa,
    [DEAL_PROPERTY_MAP.fechaPublicacionEscritura]: form.fechaPublicacionEscritura,
    [DEAL_PROPERTY_MAP.notariaEscrituraPublica]: form.notariaEscrituraPublica,
    [DEAL_PROPERTY_MAP.direccionFacturacion]: form.direccionFacturacion,
    [DEAL_PROPERTY_MAP.comuna]: form.comuna,
    [DEAL_PROPERTY_MAP.ciudadEmpresa]: form.ciudadEmpresa,
    [DEAL_PROPERTY_MAP.nombreCobranza]: form.nombreCobranza,
    [DEAL_PROPERTY_MAP.correoCobranza]: form.correoCobranza,
    [DEAL_PROPERTY_MAP.telefonoCobranza]: form.telefonoCobranza,
    [DEAL_PROPERTY_MAP.cargoCobranza]: form.cargoCobranza,
    [DEAL_PROPERTY_MAP.observacionesCobranza]: form.observacionesCobranza,
    [DEAL_PROPERTY_MAP.existePlataformaProveedores]:
      form.existePlataformaProveedores,
    [DEAL_PROPERTY_MAP.nombrePlataformaProveedores]:
      form.nombrePlataformaProveedores,
    [DEAL_PROPERTY_MAP.comentarioPlataformaProveedores]:
      form.comentarioPlataformaProveedores,
    [DEAL_PROPERTY_MAP.nombreFacturacion]: form.nombreFacturacion,
    [DEAL_PROPERTY_MAP.correoFacturacion]: form.correoFacturacion,
    [DEAL_PROPERTY_MAP.telefonoFacturacion]: form.telefonoFacturacion,
    [DEAL_PROPERTY_MAP.cargoFacturacion]: form.cargoFacturacion,
    [DEAL_PROPERTY_MAP.correoCasillaDTE]: form.correoCasillaDTE,
    [DEAL_PROPERTY_MAP.nombreRepresentanteLegal]: form.nombreRepresentanteLegal,
    [DEAL_PROPERTY_MAP.rutRepresentanteLegal]: form.rutRepresentanteLegal,
    [DEAL_PROPERTY_MAP.correoRepresentanteLegal]: form.correoRepresentanteLegal,
    [DEAL_PROPERTY_MAP.requerimientoFacturacion]:
      joinHubSpotMultiValue(form.requerimientoFacturacion),
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudOC]: form.frecuenciaSolicitudOC,
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudMIGO]: form.frecuenciaSolicitudMIGO,
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudHES]: form.frecuenciaSolicitudHES,
    [DEAL_PROPERTY_MAP.frecuenciaSolicitudEDP]: form.frecuenciaSolicitudEDP,
  });
}
