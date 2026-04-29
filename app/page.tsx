export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
            Tazki
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Ficha de cliente Tazki
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ingresa el ID del negocio para abrir la ficha conectada a HubSpot.
          </p>

          <form
            action="/ficha-cliente"
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <input
              name="id"
              placeholder="Ej: 59418649660"
              className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-500"
            />
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir ficha
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
