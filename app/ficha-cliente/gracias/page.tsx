import Image from "next/image";
import Link from "next/link";

type GraciasPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function GraciasPage({ searchParams }: GraciasPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--violet-100),_var(--violet-050)_38%,_var(--neutral-050)_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
        <div className="w-full rounded-[32px] border border-violet-200 bg-white/95 p-8 text-center shadow-[0_24px_80px_rgba(32,45,76,0.10)] sm:p-12">
          <div className="mx-auto flex w-fit rounded-3xl border border-violet-200 bg-white px-4 py-3 shadow-[0_16px_36px_rgba(53,0,168,0.10)]">
            <Image
              src="/tazki-logo.jpg"
              alt="Tazki"
              width={2029}
              height={929}
              priority
              className="h-14 w-44 object-contain sm:w-52"
            />
          </div>

          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-violet-900 text-3xl font-black text-white shadow-[0_16px_36px_rgba(53,0,168,0.22)]">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-neutral-900 sm:text-4xl">
            Gracias por rellenar el formulario
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-neutral-700">
            La ficha de cliente fue enviada correctamente y la información quedó
            guardada para el equipo de Tazki.
          </p>

          {params.id ? (
            <div className="mx-auto mt-6 w-fit rounded-3xl border border-violet-200 bg-violet-050 px-5 py-4 text-sm text-neutral-700">
              <div className="font-extrabold text-neutral-900">
                ID del negocio
              </div>
              <div className="mt-1 font-mono text-xs font-semibold text-violet-900 sm:text-sm">
                {params.id}
              </div>
            </div>
          ) : null}

          <Link
            href={params.id ? `/ficha-cliente?id=${params.id}` : "/ficha-cliente"}
            className="mt-8 inline-flex min-h-12 items-center rounded-2xl border border-violet-300 bg-violet-050 px-6 text-sm font-extrabold text-violet-900 transition hover:border-violet-400 hover:bg-violet-100 focus:outline-none focus:ring-4 focus:ring-violet-200"
          >
            Volver a la ficha
          </Link>
        </div>
      </section>
    </main>
  );
}
