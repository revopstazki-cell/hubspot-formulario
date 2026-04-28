"use client";

import { ContactSearch } from "@/components/ficha-cliente/ContactSearch";
import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import type { ContactDraft, ContactSearchResult } from "@/lib/clientForm";

type ContactBlockProps = {
  title: string;
  contact: ContactDraft;
  searchValue: string;
  roleOptions?: Array<{ label: string; value: string }>;
  roleLabel?: string;
  onSearchChange: (value: string) => void;
  onSelectExisting: (contact: ContactSearchResult) => void;
  onChange: (contact: ContactDraft) => void;
  onRemove: () => void;
  allowRemove: boolean;
};

export function ContactBlock({
  title,
  contact,
  searchValue,
  roleOptions,
  roleLabel = "Rol / Tipo de contacto",
  onSearchChange,
  onSelectExisting,
  onChange,
  onRemove,
  allowRemove,
}: ContactBlockProps) {
  function updateField<K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) {
    onChange({
      ...contact,
      [key]: value,
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {allowRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            Eliminar
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ContactSearch
          value={searchValue}
          onQueryChange={onSearchChange}
          onSelect={onSelectExisting}
        />

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {contact.selectedContactId ? (
            <>
              Contacto seleccionado desde HubSpot
              <div className="mt-1 font-mono text-xs text-slate-500">
                ID: {contact.selectedContactId}
              </div>
            </>
          ) : (
            "Puedes elegir un contacto existente o completar los campos manualmente."
          )}
        </div>

        <TextInput
          label="Nombre"
          name={`firstname-${contact.localId}`}
          value={contact.firstname}
          onChange={(value) => updateField("firstname", value)}
          required
        />
        <TextInput
          label="Apellido"
          name={`lastname-${contact.localId}`}
          value={contact.lastname}
          onChange={(value) => updateField("lastname", value)}
        />
        <TextInput
          label="Correo"
          name={`email-${contact.localId}`}
          value={contact.email}
          onChange={(value) => updateField("email", value)}
          type="email"
        />
        <TextInput
          label="Telefono"
          name={`phone-${contact.localId}`}
          value={contact.phone}
          onChange={(value) => updateField("phone", value)}
          type="tel"
        />
        <TextInput
          label="Cargo"
          name={`cargo-${contact.localId}`}
          value={contact.cargo}
          onChange={(value) => {
            updateField("cargo", value);
            updateField("jobtitle", value);
          }}
        />
        <TextInput
          label="Observaciones"
          name={`observaciones-${contact.localId}`}
          value={contact.observaciones}
          onChange={(value) => updateField("observaciones", value)}
          multiline
        />

        {roleOptions ? (
          <CheckboxGroup
            label={roleLabel}
            options={roleOptions}
            values={contact.tipoDeContacto}
            onChange={(values) => updateField("tipoDeContacto", values)}
          />
        ) : null}
      </div>
    </div>
  );
}
