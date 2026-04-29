"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { ContactSection } from "@/components/ficha-cliente/ContactSection";
import { FileUpload } from "@/components/ficha-cliente/FileUpload";
import { FormSection } from "@/components/ficha-cliente/FormSection";
import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import { readJsonSafely } from "@/lib/clientApi";
import {
  createEmptyContactDraft,
  withPrimaryContactDealFields,
  type ClientFormState,
  type ContactDraft,
} from "@/lib/clientForm";
import {
  EMAIL_FORMAT_ERROR,
  GENERAL_SAVE_ERROR,
  PHONE_FORMAT_ERROR,
  REQUIRED_FIELD_ERROR,
  RUT_FORMAT_ERROR,
} from "@/lib/formErrors";
import {
  COBRANZA_ROLE,
  DEFAULT_FORM_REQUIRED_FIELDS,
  FACTURACION_ROLE,
  LEGAL_REPRESENTATIVE_ROLE,
  type PropertyOption,
} from "@/lib/hubspotProperties";

type FichaClienteFormProps = {
  initialData: ClientFormState;
};

type ContactListKey =
  | "cobranzaContacts"
  | "facturacionContacts"
  | "legalContacts";

type OptionKey =
  | "comuna"
  | "cargo"
  | "tipoDeContacto"
  | "existePlataforma"
  | "nombrePlataforma"
  | "requerimientoFacturacion"
  | "frecuenciaOC"
  | "frecuenciaMIGO"
  | "frecuenciaHES"
  | "frecuenciaEDP";

type PropertyOptionsResponse = {
  success: boolean;
  options?: PropertyOption[];
};

type SubmitResponse = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const PROPERTY_REQUESTS: Record<
  OptionKey,
  { object: "contacts" | "deals"; property: string }
> = {
  comuna: { object: "deals", property: "comuna" },
  cargo: { object: "contacts", property: "cargo" },
  tipoDeContacto: { object: "contacts", property: "tipo_de_contacto" },
  existePlataforma: {
    object: "deals",
    property: "existe_plataforma_de_creacion_de_proveedores",
  },
  nombrePlataforma: {
    object: "deals",
    property: "nombre_plataforma_creacion_de_proveedores",
  },
  requerimientoFacturacion: {
    object: "deals",
    property: "requerimiento_facturacion",
  },
  frecuenciaOC: { object: "deals", property: "frecuencia_solicitud_oc" },
  frecuenciaMIGO: { object: "deals", property: "frecuencia_solicitud_migo" },
  frecuenciaHES: { object: "deals", property: "frecuencia_solicitud_hes" },
  frecuenciaEDP: { object: "deals", property: "frecuencia_solicitud_edp" },
};

const FIELD_LABELS: Record<string, string> = {
  dealId: "ID del negocio",
  razonSocial: "Razón social",
  rutEmpresa: "RUT Empresa",
  giroEmpresa: "Giro",
  fechaPublicacionEscritura: "Fecha publicación escritura",
  notariaEscrituraPublica: "Notaría escritura pública",
  direccionFacturacion: "Dirección facturación",
  comuna: "Comuna",
  ciudadEmpresa: "Ciudad Empresa",
  existePlataformaProveedores: "Existe plataforma de creación de proveedores",
  nombrePlataformaProveedores: "Nombre plataforma creación de proveedores",
  comentarioPlataformaProveedores: "Otra plataforma de proveedores",
  correoCasillaDTE: "Correo casilla DTE",
  personeriaFile: "Archivo de personería",
  requerimientoFacturacion: "Requerimientos facturación",
  frecuenciaSolicitudOC: "Frecuencia solicitud OC",
  frecuenciaSolicitudMIGO: "Frecuencia solicitud MIGO",
  frecuenciaSolicitudHES: "Frecuencia solicitud HES",
  frecuenciaSolicitudEDP: "Frecuencia solicitud EDP",
  legalContacts: "Contactos de Representante Legal",
  formSave: "Guardado de la ficha",
};

const CONTACT_SECTION_LABELS: Record<ContactListKey, string> = {
  cobranzaContacts: "Contactos de Cobranza / Proveedores",
  facturacionContacts: "Contactos de Facturación",
  legalContacts: "Contactos de Representante Legal",
};

const CONTACT_FIELD_LABELS: Partial<Record<keyof ContactDraft, string>> = {
  firstname: "Nombre",
  lastname: "Apellido",
  email: "Correo",
  phone: "Teléfono",
  cargo: "Cargo",
  rutRepresentanteLegal: "RUT representante legal",
  tipoDeContacto: "Tipo de contacto",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidInternationalPhone(value: string) {
  const compactValue = value.replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(compactValue);
}

function isValidRut(value: string) {
  return /^\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]$/.test(value.trim());
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function optionList(options: PropertyOption[], placeholder: string) {
  return [{ label: placeholder, value: "" }, ...options];
}

function selectedOptionMatches(
  value: string,
  options: PropertyOption[],
  labels: string[],
) {
  const selectedOption = options.find((option) => option.value === value);
  const normalizedLabels = labels.map(normalizeLabel);
  const candidates = [value, selectedOption?.label ?? ""].map(normalizeLabel);

  return candidates.some((candidate) => normalizedLabels.includes(candidate));
}

function selectedValuesInclude(
  values: string[],
  options: PropertyOption[],
  labels: string[],
) {
  return values.some((value) => selectedOptionMatches(value, options, labels));
}

function findOptionValue(options: PropertyOption[], labels: string[]) {
  const normalizedLabels = labels.map(normalizeLabel);
  const match = options.find((option) =>
    [option.label, option.value]
      .map(normalizeLabel)
      .some((value) => normalizedLabels.includes(value)),
  );

  return match?.value ?? labels[0] ?? "";
}

function contactHasData(contact: ContactDraft) {
  return Boolean(
    contact.selectedContactId ||
      contact.firstname.trim() ||
      contact.lastname.trim() ||
      contact.email.trim() ||
      contact.phone.trim() ||
      contact.cargo.trim() ||
      contact.rutRepresentanteLegal.trim() ||
      contact.tipoDeContacto.length > 0,
  );
}

function withDefaultType(contact: ContactDraft, typeValue: string) {
  return {
    ...contact,
    tipoDeContacto: Array.from(
      new Set([typeValue, ...contact.tipoDeContacto].filter(Boolean)),
    ),
  };
}

function getFieldLabel(errorKey: string) {
  const contactMatch = errorKey.match(
    /^(cobranzaContacts|facturacionContacts|legalContacts)\.(\d+)\.(.+)$/,
  );

  if (contactMatch) {
    const [, sectionKey, index, fieldKey] = contactMatch;
    const sectionLabel = CONTACT_SECTION_LABELS[sectionKey as ContactListKey];
    const fieldLabel =
      CONTACT_FIELD_LABELS[fieldKey as keyof ContactDraft] ?? fieldKey;

    return `${sectionLabel}, contacto ${Number(index) + 1}: ${fieldLabel}`;
  }

  return FIELD_LABELS[errorKey] ?? errorKey;
}

function getFieldErrorSummary(errors: Record<string, string>) {
  return Object.entries(errors).map(([key, message]) => ({
    key,
    label: getFieldLabel(key),
    message,
  }));
}

function mapSubmitFieldErrors(
  result: SubmitResponse | null,
  currentForm: ClientFormState,
) {
  const errors: Record<string, string> = {};

  if (result?.fieldErrors) {
    Object.assign(errors, result.fieldErrors);
  }

  const apiMessage = `${result?.error ?? ""} ${result?.message ?? ""}`.toLowerCase();

  if (apiMessage.includes("rut_empresa")) {
    errors.rutEmpresa = RUT_FORMAT_ERROR;
  }

  if (apiMessage.includes("rut_representante_legal")) {
    currentForm.legalContacts.forEach((_, index) => {
      errors[`legalContacts.${index}.rutRepresentanteLegal`] = RUT_FORMAT_ERROR;
    });
  }

  if (apiMessage.includes("correo_casilla_dte")) {
    errors.correoCasillaDTE = EMAIL_FORMAT_ERROR;
  }

  if (apiMessage.includes("email")) {
    for (const key of [
      "cobranzaContacts",
      "facturacionContacts",
      "legalContacts",
    ] as ContactListKey[]) {
      currentForm[key].forEach((contact, index) => {
        if (contact.email.trim()) {
          errors[`${key}.${index}.email`] = EMAIL_FORMAT_ERROR;
        }
      });
    }
  }

  if (apiMessage.includes("phone") || apiMessage.includes("telefono")) {
    for (const key of [
      "cobranzaContacts",
      "facturacionContacts",
      "legalContacts",
    ] as ContactListKey[]) {
      currentForm[key].forEach((contact, index) => {
        if (contact.phone.trim()) {
          errors[`${key}.${index}.phone`] = PHONE_FORMAT_ERROR;
        }
      });
    }
  }

  return errors;
}

export function FichaClienteForm({ initialData }: FichaClienteFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ClientFormState>(initialData);
  const [propertyOptions, setPropertyOptions] = useState<
    Partial<Record<OptionKey, PropertyOption[]>>
  >({});
  const [personeriaFile, setPersoneriaFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const entries = await Promise.all(
        Object.entries(PROPERTY_REQUESTS).map(async ([key, request]) => {
          try {
            const params = new URLSearchParams({
              object: request.object,
              property: request.property,
            });
            const response = await fetch(
              `/api/hubspot/property-options?${params.toString()}`,
            );
            const data = await readJsonSafely<PropertyOptionsResponse>(response);

            if (!response.ok || !data?.success) {
              return [key, []] as const;
            }

            return [key, data.options ?? []] as const;
          } catch {
            return [key, []] as const;
          }
        }),
      );

      if (isMounted) {
        setPropertyOptions(Object.fromEntries(entries));
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const generatedLink = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/ficha-cliente?id=${form.dealId}`;
  }, [form.dealId]);

  const typeOptions = propertyOptions.tipoDeContacto ?? [];
  const cargoOptions = propertyOptions.cargo ?? [];
  const cobranzaTypeValue = findOptionValue(typeOptions, [COBRANZA_ROLE]);
  const facturacionTypeValue = findOptionValue(typeOptions, [
    FACTURACION_ROLE,
    "Facturacion",
  ]);
  const legalTypeValue = findOptionValue(typeOptions, [LEGAL_REPRESENTATIVE_ROLE]);
  const showSupplierPlatform = selectedOptionMatches(
    form.existePlataformaProveedores,
    propertyOptions.existePlataforma ?? [],
    ["Si", "Sí", "Yes"],
  );
  const showSupplierOther = selectedOptionMatches(
    form.nombrePlataformaProveedores,
    propertyOptions.nombrePlataforma ?? [],
    ["Otra", "Otro", "Other"],
  );
  const hasRequirementOC = selectedValuesInclude(
    form.requerimientoFacturacion,
    propertyOptions.requerimientoFacturacion ?? [],
    ["OC"],
  );
  const hasRequirementMIGO = selectedValuesInclude(
    form.requerimientoFacturacion,
    propertyOptions.requerimientoFacturacion ?? [],
    ["MIGO"],
  );
  const hasRequirementHES = selectedValuesInclude(
    form.requerimientoFacturacion,
    propertyOptions.requerimientoFacturacion ?? [],
    ["HES"],
  );
  const hasRequirementEDP = selectedValuesInclude(
    form.requerimientoFacturacion,
    propertyOptions.requerimientoFacturacion ?? [],
    ["EDP"],
  );
  const fieldErrorSummary = useMemo(
    () => getFieldErrorSummary(fieldErrors),
    [fieldErrors],
  );

  function updateField<K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateContactList(key: ContactListKey, contacts: ContactDraft[]) {
    setForm((current) => ({
      ...current,
      [key]: contacts,
    }));
  }

  function createContact(defaultTypeValue: string) {
    return createEmptyContactDraft(defaultTypeValue ? [defaultTypeValue] : []);
  }

  function validateContactList(
    key: ContactListKey,
    contacts: ContactDraft[],
    errors: Record<string, string>,
  ) {
    for (const [index, contact] of contacts.entries()) {
      if (!contactHasData(contact)) {
        continue;
      }

      if (!contact.selectedContactId && !contact.email.trim()) {
        errors[`${key}.${index}.email`] =
          "Agrega correo o selecciona un contacto existente.";
      } else if (contact.email.trim() && !isValidEmail(contact.email.trim())) {
        errors[`${key}.${index}.email`] = EMAIL_FORMAT_ERROR;
      }

      if (contact.phone.trim() && !isValidInternationalPhone(contact.phone.trim())) {
        errors[`${key}.${index}.phone`] = PHONE_FORMAT_ERROR;
      }
    }
  }

  function ensureContactDefaults(formState: ClientFormState) {
    return {
      ...formState,
      cobranzaContacts: formState.cobranzaContacts.map((contact) =>
        withDefaultType(contact, cobranzaTypeValue),
      ),
      facturacionContacts: formState.facturacionContacts.map((contact) =>
        withDefaultType(contact, facturacionTypeValue),
      ),
      legalContacts: formState.legalContacts.map((contact) =>
        withDefaultType(contact, legalTypeValue),
      ),
    };
  }

  function validateForm() {
    const errors: Record<string, string> = {};
    const normalizedForm = withPrimaryContactDealFields(form);

    if (!normalizedForm.dealId) {
      errors.dealId = "No encontramos el ID del negocio en la URL.";
    }

    for (const key of DEFAULT_FORM_REQUIRED_FIELDS) {
      if (!String(normalizedForm[key] ?? "").trim()) {
        errors[key] = REQUIRED_FIELD_ERROR;
      }
    }

    if (
      normalizedForm.rutEmpresa.trim() &&
      !isValidRut(normalizedForm.rutEmpresa)
    ) {
      errors.rutEmpresa = RUT_FORMAT_ERROR;
    }

    if (
      normalizedForm.correoCasillaDTE.trim() &&
      !isValidEmail(normalizedForm.correoCasillaDTE.trim())
    ) {
      errors.correoCasillaDTE = EMAIL_FORMAT_ERROR;
    }

    validateContactList("cobranzaContacts", form.cobranzaContacts, errors);
    validateContactList("facturacionContacts", form.facturacionContacts, errors);
    validateContactList("legalContacts", form.legalContacts, errors);

    if (form.legalContacts.length === 0) {
      errors.legalContacts = "Debes agregar al menos un representante legal.";
    }

    for (const [index, contact] of form.legalContacts.entries()) {
      if (!contact.firstname.trim()) {
        errors[`legalContacts.${index}.firstname`] =
          REQUIRED_FIELD_ERROR;
      }

      if (!contact.selectedContactId && !contact.email.trim()) {
        errors[`legalContacts.${index}.email`] =
          "Agrega correo o selecciona un contacto existente.";
      }

      if (!contact.rutRepresentanteLegal.trim()) {
        errors[`legalContacts.${index}.rutRepresentanteLegal`] =
          REQUIRED_FIELD_ERROR;
      } else if (!isValidRut(contact.rutRepresentanteLegal)) {
        errors[`legalContacts.${index}.rutRepresentanteLegal`] = RUT_FORMAT_ERROR;
      }
    }

    if (personeriaFile && personeriaFile.size > MAX_FILE_SIZE_BYTES) {
      errors.personeriaFile = "El archivo no puede superar 10 MB.";
    }

    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);
    setErrorMessage("");
    setSuccessMessage("");

    if (Object.keys(errors).length > 0) {
      setErrorMessage(GENERAL_SAVE_ERROR);
      return;
    }

    setSaving(true);

    try {
      const conditionalForm: ClientFormState = ensureContactDefaults({
        ...form,
        linkFichaCliente: generatedLink,
        nombrePlataformaProveedores: showSupplierPlatform
          ? form.nombrePlataformaProveedores
          : "",
        comentarioPlataformaProveedores:
          showSupplierPlatform && showSupplierOther
            ? form.comentarioPlataformaProveedores
            : "",
        frecuenciaSolicitudOC: hasRequirementOC ? form.frecuenciaSolicitudOC : "",
        frecuenciaSolicitudMIGO: hasRequirementMIGO
          ? form.frecuenciaSolicitudMIGO
          : "",
        frecuenciaSolicitudHES: hasRequirementHES ? form.frecuenciaSolicitudHES : "",
        frecuenciaSolicitudEDP: hasRequirementEDP ? form.frecuenciaSolicitudEDP : "",
      });
      const normalizedForm = withPrimaryContactDealFields(conditionalForm);
      const body = new FormData();
      body.append("payload", JSON.stringify(normalizedForm));

      if (personeriaFile) {
        body.append("personeriaFile", personeriaFile);
      }

      const response = await fetch("/api/submit", {
        method: "POST",
        body,
      });

      const result = await readJsonSafely<SubmitResponse>(response);

      if (!response.ok || !result?.success) {
        const apiFieldErrors = mapSubmitFieldErrors(result, normalizedForm);
        setFieldErrors((current) => ({
          ...current,
          ...(Object.keys(apiFieldErrors).length > 0
            ? apiFieldErrors
            : {
                formSave:
                  "No pudimos completar el guardado. Intenta nuevamente.",
              }),
        }));
        setErrorMessage(GENERAL_SAVE_ERROR);
        return;
      }

      setErrorMessage("");
      setForm(normalizedForm);
      setPersoneriaFile(null);
      router.push(
        `/ficha-cliente/gracias?id=${encodeURIComponent(normalizedForm.dealId)}`,
      );
    } catch (error) {
      console.error(error);
      setFieldErrors({
        formSave: "No pudimos completar el guardado. Intenta nuevamente.",
      });
      setErrorMessage(GENERAL_SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#3500A8] to-[#5C62DE] p-6 text-white shadow-[0_24px_80px_rgba(53,0,168,0.24)] sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-6 flex w-fit rounded-2xl border border-white/25 bg-white/95 px-4 py-3 shadow-[0_16px_36px_rgba(32,45,76,0.12)]">
              <Image
                src="/tazki-logo.jpg"
                alt="Tazki"
                width={2029}
                height={929}
                priority
                className="h-14 w-40 object-contain sm:w-48"
              />
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Ficha de cliente
            </h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/85 sm:text-lg">
              Completa la información para iniciar el servicio correctamente
            </p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/15 px-5 py-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md lg:min-w-64">
            <div className="font-extrabold text-white/80">ID del negocio</div>
            <div className="mt-1 font-mono text-xs font-semibold text-white sm:text-sm">
              {form.dealId || "No enviado"}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <p>{errorMessage}</p>
            {fieldErrorSummary.length > 0 ? (
              <div className="mt-3 rounded-xl border border-rose-100 bg-white/70 px-4 py-3">
                <p className="font-extrabold text-rose-800">
                  Campos a corregir:
                </p>
                <ul className="mt-2 space-y-1.5">
                  {fieldErrorSummary.map((error) => (
                    <li key={error.key}>
                      <span className="font-extrabold">{error.label}</span>
                      <span>: {error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        ) : null}
      </div>

      <FormSection title="Datos - Empresa para confeccion de contrato">
        <TextInput
          label="Razon social"
          name="razonSocial"
          value={form.razonSocial}
          onChange={(value) => updateField("razonSocial", value)}
          required
          error={fieldErrors.razonSocial}
        />
        <TextInput
          label="RUT Empresa"
          name="rutEmpresa"
          value={form.rutEmpresa}
          onChange={(value) => updateField("rutEmpresa", value)}
          required
          error={fieldErrors.rutEmpresa}
        />
        <TextInput
          label="Giro"
          name="giroEmpresa"
          value={form.giroEmpresa}
          onChange={(value) => updateField("giroEmpresa", value)}
          required
          error={fieldErrors.giroEmpresa}
        />
        <TextInput
          label="Fecha publicacion escritura"
          name="fechaPublicacionEscritura"
          value={form.fechaPublicacionEscritura}
          onChange={(value) => updateField("fechaPublicacionEscritura", value)}
          type="date"
          required
          error={fieldErrors.fechaPublicacionEscritura}
        />
        <TextInput
          label="Notaria escritura publica"
          name="notariaEscrituraPublica"
          value={form.notariaEscrituraPublica}
          onChange={(value) => updateField("notariaEscrituraPublica", value)}
          required
          error={fieldErrors.notariaEscrituraPublica}
        />
        <TextInput
          label="Direccion facturacion"
          name="direccionFacturacion"
          value={form.direccionFacturacion}
          onChange={(value) => updateField("direccionFacturacion", value)}
          required
          error={fieldErrors.direccionFacturacion}
        />
        <SelectInput
          label="Comuna"
          name="comuna"
          value={form.comuna}
          onChange={(value) => updateField("comuna", value)}
          options={optionList(propertyOptions.comuna ?? [], "Selecciona comuna")}
          required
          error={fieldErrors.comuna}
        />
        <TextInput
          label="Ciudad empresa"
          name="ciudadEmpresa"
          value={form.ciudadEmpresa}
          onChange={(value) => updateField("ciudadEmpresa", value)}
          required
          error={fieldErrors.ciudadEmpresa}
        />
      </FormSection>

      <ContactSection
        title="Contactos de Cobranza / Proveedores"
        addLabel="+ Agregar contacto de cobranza"
        fieldPrefix="cobranzaContacts"
        contacts={form.cobranzaContacts}
        cargoOptions={cargoOptions}
        typeOptions={typeOptions}
        defaultTypeValue={cobranzaTypeValue}
        errors={fieldErrors}
        createContact={() => createContact(cobranzaTypeValue)}
        onChange={(contacts) => updateContactList("cobranzaContacts", contacts)}
      />

      <FormSection title="Area cobranza / proveedores">
        <TextInput
          label="Observaciones cobranza"
          name="observacionesCobranza"
          value={form.observacionesCobranza}
          onChange={(value) => updateField("observacionesCobranza", value)}
          multiline
        />
        <SelectInput
          label="Existe plataforma de creacion de proveedores"
          name="existePlataformaProveedores"
          value={form.existePlataformaProveedores}
          onChange={(value) => updateField("existePlataformaProveedores", value)}
          options={optionList(
            propertyOptions.existePlataforma ?? [],
            "Selecciona una opcion",
          )}
          required
          error={fieldErrors.existePlataformaProveedores}
        />
        {showSupplierPlatform ? (
          <SelectInput
            label="Nombre plataforma creacion de proveedores"
            name="nombrePlataformaProveedores"
            value={form.nombrePlataformaProveedores}
            onChange={(value) =>
              updateField("nombrePlataformaProveedores", value)
            }
            options={optionList(
              propertyOptions.nombrePlataforma ?? [],
              "Selecciona plataforma",
            )}
            error={fieldErrors.nombrePlataformaProveedores}
          />
        ) : null}
        {showSupplierPlatform && showSupplierOther ? (
          <TextInput
            label="Otra:"
            name="comentarioPlataformaProveedores"
            value={form.comentarioPlataformaProveedores}
            onChange={(value) =>
              updateField("comentarioPlataformaProveedores", value)
            }
            error={fieldErrors.comentarioPlataformaProveedores}
          />
        ) : null}
      </FormSection>

      <ContactSection
        title="Contactos de Facturación"
        note="Si el contacto de facturación es el mismo que el de cobranza/proveedores, puedes marcar ambos tipos de contacto en el mismo registro y no es necesario agregarlo nuevamente."
        addLabel="+ Agregar contacto de facturación"
        fieldPrefix="facturacionContacts"
        contacts={form.facturacionContacts}
        cargoOptions={cargoOptions}
        typeOptions={typeOptions}
        defaultTypeValue={facturacionTypeValue}
        errors={fieldErrors}
        createContact={() => createContact(facturacionTypeValue)}
        onChange={(contacts) =>
          updateContactList("facturacionContacts", contacts)
        }
      />

      <FormSection title="Datos - Recepcion factura">
        <TextInput
          label="Correo casilla DTE"
          name="correoCasillaDTE"
          value={form.correoCasillaDTE}
          onChange={(value) => updateField("correoCasillaDTE", value)}
          type="email"
          required
          error={fieldErrors.correoCasillaDTE}
        />
      </FormSection>

      <ContactSection
        title="Contactos de Representante Legal"
        addLabel="+ Agregar representante legal"
        fieldPrefix="legalContacts"
        contacts={form.legalContacts}
        cargoOptions={cargoOptions}
        typeOptions={typeOptions}
        defaultTypeValue={legalTypeValue}
        showRut
        errors={fieldErrors}
        createContact={() => createContact(legalTypeValue)}
        onChange={(contacts) => updateContactList("legalContacts", contacts)}
      />
      {fieldErrors.legalContacts ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {fieldErrors.legalContacts}
        </div>
      ) : null}

      <FormSection title="Archivo de personería">
        <FileUpload
          label="Personería"
          fileName={personeriaFile?.name}
          existingValue={form.personeriaArchivo}
          onChange={setPersoneriaFile}
          error={fieldErrors.personeriaFile}
          helperText="El archivo se sube desde el backend y se guarda en la propiedad personeria_ del deal."
        />
      </FormSection>

      <FormSection title="Datos - Administracion y finanzas">
        <CheckboxGroup
          label="Requerimientos facturacion"
          options={propertyOptions.requerimientoFacturacion ?? []}
          values={form.requerimientoFacturacion}
          onChange={(values) => updateField("requerimientoFacturacion", values)}
          error={fieldErrors.requerimientoFacturacion}
        />
        {hasRequirementOC ? (
          <SelectInput
            label="Frecuencia solicitud OC"
            name="frecuenciaSolicitudOC"
            value={form.frecuenciaSolicitudOC}
            onChange={(value) => updateField("frecuenciaSolicitudOC", value)}
            options={optionList(
              propertyOptions.frecuenciaOC ?? [],
              "Selecciona frecuencia",
            )}
            error={fieldErrors.frecuenciaSolicitudOC}
          />
        ) : null}
        {hasRequirementMIGO ? (
          <SelectInput
            label="Frecuencia solicitud MIGO"
            name="frecuenciaSolicitudMIGO"
            value={form.frecuenciaSolicitudMIGO}
            onChange={(value) => updateField("frecuenciaSolicitudMIGO", value)}
            options={optionList(
              propertyOptions.frecuenciaMIGO ?? [],
              "Selecciona frecuencia",
            )}
            error={fieldErrors.frecuenciaSolicitudMIGO}
          />
        ) : null}
        {hasRequirementHES ? (
          <SelectInput
            label="Frecuencia solicitud HES"
            name="frecuenciaSolicitudHES"
            value={form.frecuenciaSolicitudHES}
            onChange={(value) => updateField("frecuenciaSolicitudHES", value)}
            options={optionList(
              propertyOptions.frecuenciaHES ?? [],
              "Selecciona frecuencia",
            )}
            error={fieldErrors.frecuenciaSolicitudHES}
          />
        ) : null}
        {hasRequirementEDP ? (
          <SelectInput
            label="Frecuencia solicitud EDP"
            name="frecuenciaSolicitudEDP"
            value={form.frecuenciaSolicitudEDP}
            onChange={(value) => updateField("frecuenciaSolicitudEDP", value)}
            options={optionList(
              propertyOptions.frecuenciaEDP ?? [],
              "Selecciona frecuencia",
            )}
            error={fieldErrors.frecuenciaSolicitudEDP}
          />
        ) : null}
      </FormSection>

      <div className="flex justify-end rounded-[28px] border border-violet-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(32,45,76,0.08)]">
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 rounded-2xl bg-violet-900 px-7 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(53,0,168,0.22)] transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:shadow-none"
        >
          {saving ? "Guardando ficha..." : "Enviar ficha"}
        </button>
      </div>
    </form>
  );
}
