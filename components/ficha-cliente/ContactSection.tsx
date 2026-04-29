"use client";

import { useEffect, useState } from "react";

import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
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
  addLabel: string;
  fieldPrefix: ContactFieldPrefix;
  contacts: ContactDraft[];
  cargoOptions: PropertyOption[];
  typeOptions: PropertyOption[];
  defaultTypeValue: string;
  errors: Record<string, string>;
  onChange: (contacts: ContactDraft[]) => void;
  createContact: () => ContactDraft;
};

type ContactSearchInputProps = {
  onSelect: (contact: ContactSearchResult) => void;
};

function contactDisplayName(contact: ContactSearchResult) {
  return [contact.firstname, contact.lastname].filter(Boolean).join(" ").trim();
}

function mergeTypeValues(values: string[], defaultValue: string) {
  return Array.from(new Set([defaultValue, ...values].filter(Boolean)));
}

function ContactSearchInput({ onSelect }: ContactSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
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
        const data = (await response.json()) as {
          success: boolean;
          results?: ContactSearchResult[];
        };

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
  }, [query]);

  return (
    <div className="relative md:col-span-2">
      <TextInput
        label="Buscar contacto en HubSpot"
        name="contactSearch"
        value={query}
        onChange={(value) => {
          setQuery(value);

          if (value.trim().length < 2) {
            setResults([]);
          }
        }}
        placeholder="Nombre, apellido o correo"
      />

      {query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Buscando...</div>
          ) : results.length > 0 ? (
            results.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  onSelect(contact);
                  setQuery(contactDisplayName(contact) || contact.email);
                  setResults([]);
                }}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-[#7B3FF2]/5 last:border-b-0"
              >
                <span className="block font-medium text-slate-900">
                  {contactDisplayName(contact) || "Sin nombre"}
                </span>
                <span className="block text-slate-500">
                  {contact.email || "Sin correo"}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
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
  addLabel,
  fieldPrefix,
  contacts,
  cargoOptions,
  typeOptions,
  defaultTypeValue,
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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <button
          type="button"
          onClick={() => onChange([...contacts, createContact()])}
          className="min-h-10 rounded-lg bg-[#7B3FF2] px-4 text-sm font-semibold text-white transition hover:bg-[#6B32D9] focus:outline-none focus:ring-2 focus:ring-[#7B3FF2] focus:ring-offset-2"
        >
          {addLabel}
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No hay contactos agregados.
        </div>
      ) : null}

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={contact.localId}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Contacto {index + 1}
                </h3>
                {contact.selectedContactId ? (
                  <p className="mt-1 text-xs text-slate-500">
                    HubSpot ID: {contact.selectedContactId}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeContact(contact.localId)}
                className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
              >
                Eliminar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ContactSearchInput
                onSelect={(selected) =>
                  updateContactFromSearch(contact.localId, selected)
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
