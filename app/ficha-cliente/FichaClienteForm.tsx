"use client";

import { useMemo, useState } from "react";

import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { ContactBlock } from "@/components/ficha-cliente/ContactBlock";
import { FileUpload } from "@/components/ficha-cliente/FileUpload";
import { FormSection } from "@/components/ficha-cliente/FormSection";
import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import {
  createEmptyContactDraft,
  mapHubSpotContactToDraft,
  type ClientFormState,
  type ContactDraft,
  type ContactSearchResult,
} from "@/lib/clientForm";
import {
  DEFAULT_FORM_REQUIRED_FIELDS,
  FREQUENCY_OPTIONS,
  PLATFORM_OPTIONS,
  REQUIREMENT_OPTIONS,
  RESPONSABLE_IT_ROLE,
  STAKEHOLDER_ROLE_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/hubspotProperties";

type FichaClienteFormProps = {
  initialData: ClientFormState;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function FichaClienteForm({ initialData }: FichaClienteFormProps) {
  const [form, setForm] = useState<ClientFormState>(initialData);
  const [personeriaFile, setPersoneriaFile] = useState<File | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
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

  function updateContactList(
    key: "responsablesIT" | "stakeholders",
    nextContacts: ContactDraft[],
  ) {
    setForm((current) => ({
      ...current,
      [key]: nextContacts,
    }));
  }

  function handleContactChange(
    key: "responsablesIT" | "stakeholders",
    localId: string,
    nextContact: ContactDraft,
  ) {
    updateContactList(
      key,
      form[key].map((contact) =>
        contact.localId === localId ? nextContact : contact,
      ),
    );
  }

  function handleSelectExisting(
    key: "responsablesIT" | "stakeholders",
    localId: string,
    contact: ContactSearchResult,
  ) {
    const mapped = mapHubSpotContactToDraft(contact);
    handleContactChange(key, localId, {
      ...mapped,
      localId,
      tipoDeContacto:
        key === "responsablesIT"
          ? Array.from(
              new Set([RESPONSABLE_IT_ROLE, ...mapped.tipoDeContacto]),
            )
          : mapped.tipoDeContacto,
    });
  }

  function addContact(key: "responsablesIT" | "stakeholders") {
    updateContactList(key, [
      ...form[key],
      createEmptyContactDraft(
        key === "responsablesIT" ? [RESPONSABLE_IT_ROLE] : [],
      ),
    ]);
  }

  function removeContact(key: "responsablesIT" | "stakeholders", localId: string) {
    const next = form[key].filter((contact) => contact.localId !== localId);

    updateContactList(
      key,
      next.length > 0
        ? next
        : [createEmptyContactDraft(key === "responsablesIT" ? [RESPONSABLE_IT_ROLE] : [])],
    );
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (!form.dealId) {
      errors.dealId = "No encontramos el ID del negocio en la URL.";
    }

    for (const key of DEFAULT_FORM_REQUIRED_FIELDS) {
      if (!String(form[key] ?? "").trim()) {
        errors[key] = "Este campo es obligatorio.";
      }
    }

    const emailFields = [
      "correoCobranza",
      "correoFacturacion",
      "correoCasillaDTE",
      "correoRepresentanteLegal",
    ] as const;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const key of emailFields) {
      const value = form[key].trim();
      if (value && !emailPattern.test(value)) {
        errors[key] = "Ingresa un correo valido.";
      }
    }

    if (personeriaFile && personeriaFile.size > MAX_FILE_SIZE_BYTES) {
      errors.personeriaFile = "El archivo no puede superar 10 MB.";
    }

    if (!personeriaFile && !form.personeriaArchivo) {
      errors.personeriaFile = "Debes adjuntar la personeria o mantener una ya cargada.";
    }

    for (const [index, contact] of form.responsablesIT.entries()) {
      if (!contact.firstname.trim()) {
        errors[`responsablesIT.${index}.firstname`] = "El nombre es obligatorio.";
      }

      if (!contact.email.trim() && !contact.selectedContactId) {
        errors[`responsablesIT.${index}.email`] =
          "Agrega correo o selecciona un contacto existente.";
      }

      if (contact.email.trim() && !emailPattern.test(contact.email.trim())) {
        errors[`responsablesIT.${index}.email`] = "Correo invalido.";
      }
    }

    for (const [index, contact] of form.stakeholders.entries()) {
      if (!contact.firstname.trim()) {
        errors[`stakeholders.${index}.firstname`] = "El nombre es obligatorio.";
      }

      if (!contact.email.trim() && !contact.selectedContactId) {
        errors[`stakeholders.${index}.email`] =
          "Agrega correo o selecciona un contacto existente.";
      }

      if (contact.email.trim() && !emailPattern.test(contact.email.trim())) {
        errors[`stakeholders.${index}.email`] = "Correo invalido.";
      }
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
      const body = new FormData();
      body.append("payload", JSON.stringify({ ...form, linkFichaCliente: generatedLink }));

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
        throw new Error(result.error || result.message || "No pudimos guardar la ficha.");
      }

      setSuccessMessage("Ficha de cliente enviada correctamente");
      setErrorMessage("");
      setForm((current) => ({
        ...current,
        linkFichaCliente: generatedLink,
      }));
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-600">
              Tazki
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Ficha de cliente
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Completa o actualiza la informacion del negocio. Todo se guarda a
              traves de rutas backend, sin exponer credenciales en el navegador.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="font-medium text-slate-900">ID del negocio</div>
            <div>{form.dealId || "No enviado"}</div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

      <FormSection title="Datos - Area cobranza / proveedores">
        <TextInput
          label="Nombre encargado"
          name="nombreCobranza"
          value={form.nombreCobranza}
          onChange={(value) => updateField("nombreCobranza", value)}
          required
          error={fieldErrors.nombreCobranza}
        />
        <TextInput
          label="Correo encargado"
          name="correoCobranza"
          value={form.correoCobranza}
          onChange={(value) => updateField("correoCobranza", value)}
          type="email"
          required
          error={fieldErrors.correoCobranza}
        />
        <TextInput
          label="Telefono encargado"
          name="telefonoCobranza"
          value={form.telefonoCobranza}
          onChange={(value) => updateField("telefonoCobranza", value)}
          type="tel"
          required
          error={fieldErrors.telefonoCobranza}
        />
        <TextInput
          label="Cargo persona cobranza"
          name="cargoCobranza"
          value={form.cargoCobranza}
          onChange={(value) => updateField("cargoCobranza", value)}
        />
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
          onChange={(value) => updateField("comentarioPlataformaProveedores", value)}
          multiline
        />
      </FormSection>

      <FormSection title="Datos - Recepcion factura">
        <TextInput
          label="Nombre contacto facturacion"
          name="nombreFacturacion"
          value={form.nombreFacturacion}
          onChange={(value) => updateField("nombreFacturacion", value)}
          required
          error={fieldErrors.nombreFacturacion}
        />
        <TextInput
          label="Correo contacto facturacion"
          name="correoFacturacion"
          value={form.correoFacturacion}
          onChange={(value) => updateField("correoFacturacion", value)}
          type="email"
          required
          error={fieldErrors.correoFacturacion}
        />
        <TextInput
          label="Telefono contacto facturacion"
          name="telefonoFacturacion"
          value={form.telefonoFacturacion}
          onChange={(value) => updateField("telefonoFacturacion", value)}
          type="tel"
          required
          error={fieldErrors.telefonoFacturacion}
        />
        <TextInput
          label="Cargo persona facturacion"
          name="cargoFacturacion"
          value={form.cargoFacturacion}
          onChange={(value) => updateField("cargoFacturacion", value)}
        />
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

      <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Contactos adicionales
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Puedes asociar responsables de IT y stakeholders existentes o nuevos
              al negocio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addContact("responsablesIT")}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              + Agregar Responsable IT
            </button>
            <button
              type="button"
              onClick={() => addContact("stakeholders")}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              + Agregar Stakeholder
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {form.responsablesIT.map((contact, index) => (
            <ContactBlock
              key={contact.localId}
              title={`Responsable IT ${index + 1}`}
              contact={contact}
              searchValue={searchQueries[contact.localId] ?? ""}
              onSearchChange={(value) =>
                setSearchQueries((current) => ({
                  ...current,
                  [contact.localId]: value,
                }))
              }
              onSelectExisting={(selected) =>
                handleSelectExisting("responsablesIT", contact.localId, selected)
              }
              onChange={(next) =>
                handleContactChange("responsablesIT", contact.localId, next)
              }
              onRemove={() => removeContact("responsablesIT", contact.localId)}
              allowRemove={form.responsablesIT.length > 1}
            />
          ))}

          {form.stakeholders.map((contact, index) => (
            <ContactBlock
              key={contact.localId}
              title={`Stakeholder ${index + 1}`}
              contact={contact}
              roleOptions={STAKEHOLDER_ROLE_OPTIONS}
              searchValue={searchQueries[contact.localId] ?? ""}
              onSearchChange={(value) =>
                setSearchQueries((current) => ({
                  ...current,
                  [contact.localId]: value,
                }))
              }
              onSelectExisting={(selected) =>
                handleSelectExisting("stakeholders", contact.localId, selected)
              }
              onChange={(next) =>
                handleContactChange("stakeholders", contact.localId, next)
              }
              onRemove={() => removeContact("stakeholders", contact.localId)}
              allowRemove={form.stakeholders.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">
          Solo enviaremos a HubSpot campos con contenido. No sobreescribimos datos
          existentes con valores vacios.
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "Guardando ficha..." : "Enviar ficha cliente"}
        </button>
      </div>
    </form>
  );
}
