export const DEAL_PROPERTY_MAP = {
  linkFichaCliente: "link_ficha_de_cliente_trini",
  razonSocial: "razon_social",
  rutEmpresa: "rut_empresa",
  giroEmpresa: "giro_empresa",
  fechaPublicacionEscritura: "fecha_publicacion_escritura",
  notariaEscrituraPublica: "notaria_escritura_publica",
  direccionFacturacion: "direccion_facturacion",
  comuna: "comuna",
  ciudadEmpresa: "ciudad_empresa",
  nombreCobranza: "nombre_y_apellido_persona_de_cobranza",
  correoCobranza: "correo_persona_de_cobranza",
  telefonoCobranza: "telefono_persona_cobranza",
  cargoCobranza: "cargo_persona_de_cobranza",
  observacionesCobranza: "observaciones_cobranza",
  existePlataformaProveedores:
    "existe_plataforma_de_creacion_de_proveedores",
  nombrePlataformaProveedores:
    "nombre_plataforma_creacion_de_proveedores",
  comentarioPlataformaProveedores:
    "comentario_plataforma_creacion_de_proveedores",
  nombreFacturacion: "nombre_y_apellido_del_contacto_de_facturacion",
  correoFacturacion: "correo_del_contacto_de_facturacion",
  telefonoFacturacion: "telefono_persona_facturacion",
  cargoFacturacion: "cargo_persona_facturacion",
  correoCasillaDTE: "correo_casilla_dte",
  nombreRepresentanteLegal: "nombre_representante_legal",
  rutRepresentanteLegal: "rut_representante_legal",
  correoRepresentanteLegal: "correo_representante_legal",
  personeriaArchivo: "personeria_",
  requerimientoFacturacion: "requerimiento_facturacion",
  frecuenciaSolicitudOC: "frecuencia_solicitud_oc",
  frecuenciaSolicitudMIGO: "frecuencia_solicitud_migo",
  frecuenciaSolicitudHES: "frecuencia_solicitud_hes",
  frecuenciaSolicitudEDP: "frecuencia_solicitud_edp",
} as const;

export const CONTACT_PROPERTY_MAP = {
  firstname: "firstname",
  lastname: "lastname",
  email: "email",
  phone: "phone",
  jobtitle: "jobtitle",
  cargo: "cargo",
  tipoDeContacto: "tipo_de_contacto",
  observaciones: "observaciones",
  idDeNegocio: "id_de_negocio",
} as const;

export const DEAL_PROPERTIES = Object.values(DEAL_PROPERTY_MAP);
export const CONTACT_PROPERTIES = Object.values(CONTACT_PROPERTY_MAP);

export const YES_NO_OPTIONS = [
  { label: "Si", value: "Si" },
  { label: "No", value: "No" },
];

export const PLATFORM_OPTIONS = [
  { label: "Selecciona una opcion", value: "" },
  { label: "Otra", value: "Otra" },
  { label: "SAP Ariba", value: "SAP Ariba" },
  { label: "AP Ariba", value: "AP Ariba" },
  { label: "Oracle NetSuite", value: "Oracle NetSuite" },
  { label: "Microsoft Dynamics 365", value: "Microsoft Dynamics 365" },
  { label: "Defontana", value: "Defontana" },
  { label: "Softland", value: "Softland" },
  { label: "Transtecnia", value: "Transtecnia" },
];

export const FREQUENCY_OPTIONS = [
  { label: "Selecciona una opcion", value: "" },
  { label: "Mensual", value: "Mensual" },
  { label: "Anual", value: "Anual" },
  { label: "Trimestral", value: "Trimestral" },
  { label: "Semestral", value: "Semestral" },
  { label: "Multianual", value: "Multianual" },
];

export const REQUIREMENT_OPTIONS = [
  { label: "OC", value: "OC" },
  { label: "MIGO", value: "MIGO" },
  { label: "HES", value: "HES" },
  { label: "EDP", value: "EDP" },
];

export const STAKEHOLDER_ROLE_OPTIONS = [
  "Tomador de decision",
  "Compras",
  "Pagos",
  "Administracion",
  "Facturacion",
  "Casilla de DTE",
  "Champion",
  "Influencer",
  "Usuario",
  "Referidor",
  "Representante Legal",
  "Cobranza/Proveedores",
  "Mutual - OC y Facturacion",
  "Mutual - Ejecutivo de cuenta",
  "Mutual - Ejecutivo de ventas",
  "Administrador Tazki",
  "Responsable IT",
  "Stakeholders CS",
  "Mutual - Prevencionista",
].map((role) => ({ label: role, value: role }));

export const RESPONSABLE_IT_ROLE = "Responsable IT";

export const DEFAULT_FORM_REQUIRED_FIELDS = [
  "razonSocial",
  "rutEmpresa",
  "giroEmpresa",
  "fechaPublicacionEscritura",
  "notariaEscrituraPublica",
  "direccionFacturacion",
  "comuna",
  "ciudadEmpresa",
  "nombreCobranza",
  "correoCobranza",
  "telefonoCobranza",
  "existePlataformaProveedores",
  "nombreFacturacion",
  "correoFacturacion",
  "telefonoFacturacion",
  "correoCasillaDTE",
  "nombreRepresentanteLegal",
  "rutRepresentanteLegal",
  "correoRepresentanteLegal",
] as const;
