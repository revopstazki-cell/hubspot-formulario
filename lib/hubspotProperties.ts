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
  cargo: "cargo",
  tipoDeContacto: "tipo_de_contacto",
  observaciones: "observaciones",
  idDeNegocio: "id_de_negocio",
  rutRepresentanteLegal: "rut_representante_legal",
} as const;

export const DEAL_PROPERTIES = Object.values(DEAL_PROPERTY_MAP);
export const CONTACT_PROPERTIES = Object.values(CONTACT_PROPERTY_MAP);

export type PropertyOption = {
  label: string;
  value: string;
};

export const COBRANZA_ROLE = "Cobranza/Proveedores";
export const FACTURACION_ROLE = "Facturación";
export const LEGAL_REPRESENTATIVE_ROLE = "Representante Legal";

export const DEFAULT_FORM_REQUIRED_FIELDS = [
  "razonSocial",
  "rutEmpresa",
  "giroEmpresa",
  "fechaPublicacionEscritura",
  "notariaEscrituraPublica",
  "direccionFacturacion",
  "comuna",
  "ciudadEmpresa",
  "existePlataformaProveedores",
  "correoCasillaDTE",
] as const;
