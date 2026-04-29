"use client";

import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import type { ContactDraft } from "@/lib/clientForm";
import { CARGO_OPTIONS } from "@/lib/hubspotProperties";

type ContactSectionProps = {
  title: string;
  description?: string;
  addLabel: string;
  fieldPrefix: "cobranzaContacts" | "facturacionContacts";
  contacts: ContactDraft[];
  errors: Record<string, string>;
  onChange: (contacts: ContactDraft[]) => void;
  createContact: () => ContactDraft;
};

export function ContactSection({
  title,
  description,
  addLabel,
  fieldPrefix,
  contacts,
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

  function removeContact(localId: string) {
    const nextContacts = contacts.filter((contact) => contact.localId !== localId);
    onChange(nextContacts.length > 0 ? nextContacts : [createContact()]);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onChange([...contacts, createContact()])}
          className="min-h-10 rounded-lg bg-[#7B3FF2] px-4 text-sm font-semibold text-white transition hover:bg-[#6B32D9] focus:outline-none focus:ring-2 focus:ring-[#7B3FF2] focus:ring-offset-2"
        >
          {addLabel}
        </button>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={contact.localId}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Contacto {index + 1}
              </h3>
              {contacts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeContact(contact.localId)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                >
                  Eliminar
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Nombre"
                name={`${fieldPrefix}-${index}-firstname`}
                value={contact.firstname}
                onChange={(value) =>
                  updateContact(contact.localId, "firstname", value)
                }
                required
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
                required
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
                required
                error={errors[`${fieldPrefix}.${index}.phone`]}
                helperText="Usa formato internacional, por ejemplo +56912345678."
              />
              <SelectInput
                label="Cargo"
                name={`${fieldPrefix}-${index}-cargo`}
                value={contact.cargo}
                onChange={(value) =>
                  updateContact(contact.localId, "cargo", value)
                }
                options={CARGO_OPTIONS}
                required
                error={errors[`${fieldPrefix}.${index}.cargo`]}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
