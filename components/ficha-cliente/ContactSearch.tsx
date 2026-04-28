"use client";

import { useEffect, useState } from "react";

import type { ContactSearchResult } from "@/lib/clientForm";

type ContactSearchProps = {
  value: string;
  onQueryChange: (value: string) => void;
  onSelect: (contact: ContactSearchResult) => void;
};

export function ContactSearch({
  value,
  onQueryChange,
  onSelect,
}: ContactSearchProps) {
  const [results, setResults] = useState<ContactSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();

    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          success: boolean;
          results: ContactSearchResult[];
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
  }, [value]);

  return (
    <div className="relative md:col-span-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">
          Buscar contacto en HubSpot
        </span>
        <input
          value={value}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Busca por nombre o correo"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
        />
      </label>
      {value.trim().length >= 2 ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Buscando...</div>
          ) : results.length > 0 ? (
            results.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  onSelect(contact);
                  onQueryChange(
                    `${contact.firstname} ${contact.lastname}`.trim() || contact.email,
                  );
                  setResults([]);
                }}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
              >
                <div className="font-medium text-slate-900">
                  {[contact.firstname, contact.lastname].filter(Boolean).join(" ") ||
                    "Sin nombre"}
                </div>
                <div className="text-slate-500">{contact.email || "Sin correo"}</div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              No encontramos coincidencias.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
