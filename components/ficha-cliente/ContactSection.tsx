"use client";

import { CheckboxGroup } from "@/components/ficha-cliente/CheckboxGroup";
import { SelectInput } from "@/components/ficha-cliente/SelectInput";
import { TextInput } from "@/components/ficha-cliente/TextInput";
import type { ContactDraft } from "@/lib/clientForm";
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

export function ContactSection({
  title,
  note,
  addLabel,
  fieldPrefix,
  contacts,
  cargoOptions,
  typeOptions,
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
