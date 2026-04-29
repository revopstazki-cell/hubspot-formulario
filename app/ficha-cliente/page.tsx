import { FichaClienteForm } from "@/app/ficha-cliente/FichaClienteForm";
import {
  createEmptyClientFormState,
  mapHubSpotDealToFormState,
  type ClientFormState,
} from "@/lib/clientForm";
import { getDealById } from "@/lib/hubspot";

type FichaClientePageProps = {
  searchParams: Promise<{
    id?: string;
    id_de_negocio?: string;
  }>;
};

export default async function FichaClientePage({
  searchParams,
}: FichaClientePageProps) {
  const params = await searchParams;
  const dealId = params.id ?? params.id_de_negocio ?? "";

  let initialData: ClientFormState = createEmptyClientFormState(dealId);
  let loadError = "";

  if (dealId) {
    try {
      const { deal, associatedContacts } = await getDealById(dealId);
      initialData = mapHubSpotDealToFormState(deal, associatedContacts);
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "No pudimos cargar la informacion del deal desde HubSpot.";
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--violet-100),_var(--violet-050)_38%,_var(--neutral-050)_100%)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {!dealId ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 shadow-[0_16px_48px_rgba(32,45,76,0.08)]">
            Falta el ID del negocio en la URL. Usa{" "}
            <code className="rounded bg-amber-100 px-2 py-1">?id=59418649660</code>{" "}
            o{" "}
            <code className="rounded bg-amber-100 px-2 py-1">
              ?id_de_negocio=59418649660
            </code>
            .
          </div>
        ) : null}

        {loadError ? (
          <div className="mb-8 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-[0_16px_48px_rgba(32,45,76,0.08)]">
            No pudimos precargar el deal desde HubSpot. Puedes seguir editando la
            ficha manualmente.
            <div className="mt-2 font-medium">{loadError}</div>
          </div>
        ) : null}

        <FichaClienteForm initialData={initialData} />
      </div>
    </main>
  );
}
