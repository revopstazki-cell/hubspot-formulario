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
  const dealId = params.id ?? params.id_de_negocio ?? "No enviado";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Ficha Cliente
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          ID del negocio: {dealId}
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Esta pagina de prueba lee el parametro <code>id</code> o{" "}
          <code>id_de_negocio</code> desde la URL.
        </p>
      </section>
    </main>
  );
}
