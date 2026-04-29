"use client";

import { useEffect, useState } from "react";

import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import { readJsonSafely } from "@/lib/clientApi";
import {
  mapHubSpotContactToDraft,
  type ContactDraft,
  type ContactSearchResult,
} from "@/lib/clientForm";
import type { PropertyOption } from "@/lib/hubspotProperties";

type ContactFieldPrefix =
  | "cobranzaContacts"
  | "facturacionContacts"
  | "legalContacts";

type ContactSectionProps = {
  title: string;
  note?: string;
  addLabel: string;
  fieldPrefix: ContactFieldPrefix;
  contacts: ContactDraft[];
  cargoOptions: PropertyOption[];
  typeOptions: PropertyOption[];
  defaultTypeValue: string;
  showRut?: boolean;
  errors: Record<string, string>;
  onChange: (contacts: ContactDraft[]) => void;
  createContact: () => ContactDraft;
};

type ContactSearchInputProps = {
  contact: ContactDraft;
  onSelect: (contact: ContactSearchResult) => void;
  onClearSelection: () => void;
};

function contactDisplayName(
  contact: Pick<ContactDraft | ContactSearchResult, "firstname" | "lastname" | "email">,
) {
  return [contact.firstname, contact.lastname].filter(Boolean).join(" ").trim();
}

function mergeTypeValues(values: string[], defaultValue: string) {
  return Array.from(new Set([defaultValue, ...values].filter(Boolean)));
}

function ContactSearchInput({
  contact,
  onSelect,
  onClearSelection,
}: ContactSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const selectedLabel = contactDisplayName(contact) || contact.email;
  const hasSelection = Boolean(contact.selectedContactId) && !isChanging;

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (hasSelection || trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        const data = await readJsonSafely<{
          success: boolean;
          results?: ContactSearchResult[];
        }>(response);

        if (!response.ok || !data?.success) {
          setResults([]);
          return;
        }

        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [hasSelection, query]);

  if (hasSelection) {
    return (
      <div className="md:col-span-2">
        <div className="rounded-2xl border border-violet-300 bg-violet-050 px-4 py-3 text-sm shadow-[0_12px_36px_rgba(63,30,201,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-extrabold text-neutral-900">
                Contacto seleccionado desde HubSpot
              </div>
              <div className="mt-1 font-medium text-neutral-700">
                {selectedLabel}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChanging(true);
                  setQuery("");
                  setResults([]);
                }}
                className="rounded-xl bg-violet-900 px-3 py-2 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(53,0,168,0.18)] transition hover:bg-violet-800"
              >
                Cambiar contacto
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChanging(false);
                  setQuery("");
                  setResults([]);
                  onClearSelection();
                }}
                className="rounded-xl border border-violet-300 bg-white px-3 py-2 text-xs font-extrabold text-violet-900 transition hover:bg-violet-000"
              >
                Limpiar selección
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative md:col-span-2">
      <TextInput
        label="Buscar contacto en HubSpot"
        name="contactSearch"
        value={query}
        onChange={(value) => {
          if (contact.selectedContactId) {
            onClearSelection();
          }

          setQuery(value);

          if (value.trim().length < 2) {
            setResults([]);
          }
        }}
        placeholder="Nombre, apellido o correo"
      />

      {query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-violet-200 bg-white shadow-[0_18px_60px_rgba(32,45,76,0.14)]">
          {loading ? (
            <div className="px-4 py-3 text-sm font-medium text-neutral-600">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            results.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  onSelect(contact);
                  setIsChanging(false);
                  setQuery("");
                  setResults([]);
                }}
                className="block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm transition hover:bg-violet-050 last:border-b-0"
              >
                <span className="block font-extrabold text-neutral-900">
                  {contactDisplayName(contact) || "Sin nombre"}
                </span>
                <span className="block font-medium text-neutral-600">
                  {contact.email || "Sin correo"}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm font-medium text-neutral-600">
              No encontramos contactos.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ContactSection({
  title,
  note,
  addLabel,
  fieldPrefix,
  contacts,
  cargoOptions,
  typeOptions,
  defaultTypeValue,
  showRut,
  errors,
  onChange,
  createContact,
}: ContactSectionProps) {
  function updateContact<K extends keyof ContactDraft>(
    localId: string,
    key: K,
    value: ContactDraft[K],
  ) {
    onChange(
      contacts.map((contact) =>
        contact.localId === localId ? { ...contact, [key]: value } : contact,
      ),
    );
  }

  function updateContactFromSearch(localId: string, selected: ContactSearchResult) {
    const mappedContact = mapHubSpotContactToDraft(selected);

    onChange(
      contacts.map((contact) =>
        contact.localId === localId
          ? {
              ...mappedContact,
              localId,
              tipoDeContacto: mergeTypeValues(
                mappedContact.tipoDeContacto,
                defaultTypeValue,
              ),
            }
          : contact,
      ),
    );
  }

  function removeContact(localId: string) {
    onChange(contacts.filter((contact) => contact.localId !== localId));
  }

  return (
    <section className="rounded-[28px] border border-violet-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(32,45,76,0.08)] sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-violet-700" />
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-neutral-900">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onChange([...contacts, createContact()])}
          className="min-h-10 rounded-2xl border border-violet-300 bg-violet-050 px-4 text-sm font-extrabold text-violet-900 transition hover:border-violet-400 hover:bg-violet-100 focus:outline-none focus:ring-4 focus:ring-violet-200"
        >
          {addLabel}
        </button>
      </div>

      {note ? (
        <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-050 px-4 py-3 text-sm font-medium leading-6 text-neutral-700">
          {note}
        </div>
      ) : null}

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-050 px-5 py-6 text-sm font-medium text-neutral-600">
          No hay contactos agregados.
        </div>
      ) : null}

      <div className="space-y-5">
        {contacts.map((contact, index) => (
          <div
            key={contact.localId}
            className="rounded-3xl border border-neutral-200 bg-neutral-050/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900">
                  Contacto {index + 1}
                </h3>
                {contact.selectedContactId ? (
                  <p className="mt-1 text-xs font-medium text-neutral-600">
                    HubSpot ID: {contact.selectedContactId}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeContact(contact.localId)}
                className="rounded-2xl border border-rose-100 bg-white px-3 py-2 text-sm font-bold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
              >
                Eliminar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ContactSearchInput
                contact={contact}
                onSelect={(selected) =>
                  updateContactFromSearch(contact.localId, selected)
                }
                onClearSelection={() =>
                  updateContact(contact.localId, "selectedContactId", "")
                }
              />
              <TextInput
                label="Nombre"
                name={`${fieldPrefix}-${index}-firstname`}
                value={contact.firstname}
                onChange={(value) =>
                  updateContact(contact.localId, "firstname", value)
                }
                error={errors[`${fieldPrefix}.${index}.firstname`]}
              />
              <TextInput
                label="Apellido"
                name={`${fieldPrefix}-${index}-lastname`}
                value={contact.lastname}
                onChange={(value) =>
                  updateContact(contact.localId, "lastname", value)
                }
              />
              <TextInput
                label="Correo"
                name={`${fieldPrefix}-${index}-email`}
                value={contact.email}
                onChange={(value) =>
                  updateContact(contact.localId, "email", value)
                }
                type="email"
                error={errors[`${fieldPrefix}.${index}.email`]}
              />
              <TextInput
                label="Teléfono"
                name={`${fieldPrefix}-${index}-phone`}
                value={contact.phone}
                onChange={(value) =>
                  updateContact(contact.localId, "phone", value)
                }
                type="tel"
                placeholder="+56912345678"
                error={errors[`${fieldPrefix}.${index}.phone`]}
                helperText="Formato internacional, por ejemplo +56912345678."
              />
              <SelectInput
                label="Cargo"
                name={`${fieldPrefix}-${index}-cargo`}
                value={contact.cargo}
                onChange={(value) =>
                  updateContact(contact.localId, "cargo", value)
                }
                options={[{ label: "Selecciona un cargo", value: "" }, ...cargoOptions]}
                error={errors[`${fieldPrefix}.${index}.cargo`]}
              />
              {showRut ? (
                <TextInput
                  label="RUT representante legal"
                  name={`${fieldPrefix}-${index}-rutRepresentanteLegal`}
                  value={contact.rutRepresentanteLegal}
                  onChange={(value) =>
                    updateContact(
                      contact.localId,
                      "rutRepresentanteLegal",
                      value,
                    )
                  }
                  required
                  error={
                    errors[`${fieldPrefix}.${index}.rutRepresentanteLegal`]
                  }
                  helperText="Acepta formatos como 12.345.678-9 o 12345678-9."
                />
              ) : null}
              <CheckboxGroup
                label="Tipo de contacto"
                options={typeOptions}
                values={contact.tipoDeContacto}
                onChange={(values) =>
                  updateContact(contact.localId, "tipoDeContacto", values)
                }
                error={errors[`${fieldPrefix}.${index}.tipoDeContacto`]}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
