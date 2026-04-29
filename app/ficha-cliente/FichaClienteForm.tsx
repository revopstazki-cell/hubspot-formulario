"use client";

import { useMemo, useState } from "react";

import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { ContactSection } from "@/components/ficha-cliente/ContactSection";
import { FileUpload } from "@/components/ficha-cliente/FileUpload";
import { FormSection } from "@/components/ficha-cliente/FormSection";
import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import {
  createEmptyContactDraft,
  withPrimaryContactDealFields,
  type ClientFormState,
  type ContactDraft,
} from "@/lib/clientForm";
import {
  COBRANZA_ROLE,
  DEFAULT_FORM_REQUIRED_FIELDS,
  FACTURACION_ROLE,
  FREQUENCY_OPTIONS,
  PLATFORM_OPTIONS,
  REQUIREMENT_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/hubspotProperties";

type FichaClienteFormProps = {
  initialData: ClientFormState;
};

type ContactListKey = "cobranzaContacts" | "facturacionContacts";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidInternationalPhone(value: string) {
  const compactValue = value.replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(compactValue);
}

function createContact(role: string) {
  return createEmptyContactDraft([role]);
}

export function FichaClienteForm({ initialData }: FichaClienteFormProps) {
  const [form, setForm] = useState<ClientFormState>(initialData);
  const [personeriaFile, setPersoneriaFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const generatedLink = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/ficha-cliente?id=${form.dealId}`;
  }, [form.dealId]);

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

  function validateContactList(
    key: ContactListKey,
    contacts: ContactDraft[],
    errors: Record<string, string>,
  ) {
    for (const [index, contact] of contacts.entries()) {
      if (!contact.firstname.trim()) {
        errors[`${key}.${index}.firstname`] = "El nombre es obligatorio.";
      }

      if (!contact.email.trim()) {
        errors[`${key}.${index}.email`] = "El correo es obligatorio.";
      } else if (!isValidEmail(contact.email.trim())) {
        errors[`${key}.${index}.email`] = "Ingresa un correo valido.";
      }

      if (!contact.phone.trim()) {
        errors[`${key}.${index}.phone`] = "El telefono es obligatorio.";
      } else if (!isValidInternationalPhone(contact.phone.trim())) {
        errors[`${key}.${index}.phone`] =
          "Usa formato internacional, por ejemplo +56912345678.";
      }

      if (!contact.cargo.trim()) {
        errors[`${key}.${index}.cargo`] = "Selecciona un cargo.";
      }
    }
  }

  function validateForm() {
    const errors: Record<string, string> = {};
    const normalizedForm = withPrimaryContactDealFields(form);

    if (!normalizedForm.dealId) {
      errors.dealId = "No encontramos el ID del negocio en la URL.";
    }

    for (const key of DEFAULT_FORM_REQUIRED_FIELDS) {
      if (!String(normalizedForm[key] ?? "").trim()) {
        errors[key] = "Este campo es obligatorio.";
      }
    }

    const directEmailFields = [
      "correoCasillaDTE",
      "correoRepresentanteLegal",
    ] as const;

    for (const key of directEmailFields) {
      const value = normalizedForm[key].trim();

      if (value && !isValidEmail(value)) {
        errors[key] = "Ingresa un correo valido.";
      }
    }

    validateContactList("cobranzaContacts", form.cobranzaContacts, errors);
    validateContactList(
      "facturacionContacts",
      form.facturacionContacts,
      errors,
    );

    if (personeriaFile && personeriaFile.size > MAX_FILE_SIZE_BYTES) {
      errors.personeriaFile = "El archivo no puede superar 10 MB.";
    }

    if (!personeriaFile && !normalizedForm.personeriaArchivo) {
      errors.personeriaFile =
        "Debes adjuntar la personeria o mantener una ya cargada.";
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
      setErrorMessage("Revisa los campos obligatorios antes de enviar.");
      return;
    }

    setSaving(true);

    try {
      const normalizedForm = withPrimaryContactDealFields({
        ...form,
        linkFichaCliente: generatedLink,
      });
      const body = new FormData();
      body.append("payload", JSON.stringify(normalizedForm));

      if (personeriaFile) {
        body.append("personeriaFile", personeriaFile);
      }

      const response = await fetch("/api/submit-client-form", {
        method: "POST",
        body,
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || result.message || "No pudimos guardar la ficha.",
        );
      }

      setSuccessMessage("Ficha de cliente enviada correctamente");
      setErrorMessage("");
      setForm(normalizedForm);
      setPersoneriaFile(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No pudimos guardar la ficha.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7B3FF2] text-xl font-bold text-white">
              T
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-[#7B3FF2]">
                Tazki
              </p>
              <h1 className="text-3xl font-semibold text-slate-950">
                Ficha de cliente
              </h1>
            </div>
          </div>
          <div className="rounded-lg border border-[#7B3FF2]/20 bg-[#7B3FF2]/5 px-4 py-3 text-sm text-slate-700">
            <div className="font-medium text-slate-950">ID del negocio</div>
            <div>{form.dealId || "No enviado"}</div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
        <TextInput
          label="Comuna"
          name="comuna"
          value={form.comuna}
          onChange={(value) => updateField("comuna", value)}
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
        title="Datos de Cobranza / Proveedores"
        description="Agrega uno o mas contactos para cobranza y proveedores."
        addLabel="+ Agregar contacto"
        fieldPrefix="cobranzaContacts"
        contacts={form.cobranzaContacts}
        errors={fieldErrors}
        createContact={() => createContact(COBRANZA_ROLE)}
        onChange={(contacts) => updateContactList("cobranzaContacts", contacts)}
      />

      <FormSection title="Datos - Plataforma proveedores">
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
          options={[{ label: "Selecciona una opcion", value: "" }, ...YES_NO_OPTIONS]}
          required
          error={fieldErrors.existePlataformaProveedores}
        />
        <SelectInput
          label="Nombre plataforma creacion de proveedores"
          name="nombrePlataformaProveedores"
          value={form.nombrePlataformaProveedores}
          onChange={(value) => updateField("nombrePlataformaProveedores", value)}
          options={PLATFORM_OPTIONS}
        />
        <TextInput
          label="Comentario plataforma creacion de proveedores"
          name="comentarioPlataformaProveedores"
          value={form.comentarioPlataformaProveedores}
          onChange={(value) =>
            updateField("comentarioPlataformaProveedores", value)
          }
          multiline
        />
      </FormSection>

      <ContactSection
        title="Datos de Facturación"
        description="Agrega uno o mas contactos para recepcion y gestion de facturas."
        addLabel="+ Agregar contacto"
        fieldPrefix="facturacionContacts"
        contacts={form.facturacionContacts}
        errors={fieldErrors}
        createContact={() => createContact(FACTURACION_ROLE)}
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

      <FormSection title="Datos - Representante legal">
        <TextInput
          label="Nombre representante legal"
          name="nombreRepresentanteLegal"
          value={form.nombreRepresentanteLegal}
          onChange={(value) => updateField("nombreRepresentanteLegal", value)}
          required
          error={fieldErrors.nombreRepresentanteLegal}
        />
        <TextInput
          label="RUT representante legal"
          name="rutRepresentanteLegal"
          value={form.rutRepresentanteLegal}
          onChange={(value) => updateField("rutRepresentanteLegal", value)}
          required
          error={fieldErrors.rutRepresentanteLegal}
        />
        <TextInput
          label="Correo representante legal"
          name="correoRepresentanteLegal"
          value={form.correoRepresentanteLegal}
          onChange={(value) => updateField("correoRepresentanteLegal", value)}
          type="email"
          required
          error={fieldErrors.correoRepresentanteLegal}
        />
        <FileUpload
          label="Personeria archivo"
          required
          fileName={personeriaFile?.name || form.personeriaArchivo}
          onChange={setPersoneriaFile}
          error={fieldErrors.personeriaFile}
          helperText="Subiremos el archivo desde backend a HubSpot y guardaremos su referencia en el deal."
        />
      </FormSection>

      <FormSection title="Datos - Administracion y finanzas">
        <CheckboxGroup
          label="Requerimientos facturacion"
          options={REQUIREMENT_OPTIONS}
          values={form.requerimientoFacturacion}
          onChange={(values) => updateField("requerimientoFacturacion", values)}
        />
        <SelectInput
          label="Frecuencia solicitud OC"
          name="frecuenciaSolicitudOC"
          value={form.frecuenciaSolicitudOC}
          onChange={(value) => updateField("frecuenciaSolicitudOC", value)}
          options={FREQUENCY_OPTIONS}
        />
        <SelectInput
          label="Frecuencia solicitud MIGO"
          name="frecuenciaSolicitudMIGO"
          value={form.frecuenciaSolicitudMIGO}
          onChange={(value) => updateField("frecuenciaSolicitudMIGO", value)}
          options={FREQUENCY_OPTIONS}
        />
        <SelectInput
          label="Frecuencia solicitud HES"
          name="frecuenciaSolicitudHES"
          value={form.frecuenciaSolicitudHES}
          onChange={(value) => updateField("frecuenciaSolicitudHES", value)}
          options={FREQUENCY_OPTIONS}
        />
        <SelectInput
          label="Frecuencia solicitud EDP"
          name="frecuenciaSolicitudEDP"
          value={form.frecuenciaSolicitudEDP}
          onChange={(value) => updateField("frecuenciaSolicitudEDP", value)}
          options={FREQUENCY_OPTIONS}
        />
      </FormSection>

      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">
          Solo enviaremos a HubSpot campos con contenido. No sobreescribimos datos
          existentes con valores vacios.
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-lg bg-[#7B3FF2] px-6 text-sm font-semibold text-white transition hover:bg-[#6B32D9] focus:outline-none focus:ring-2 focus:ring-[#7B3FF2] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "Guardando ficha..." : "Enviar ficha cliente"}
        </button>
      </div>
    </form>
  );
}
