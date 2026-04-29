import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EBEBFF,#FBFBFF_42%,#F8FAFF_100%)] px-4 py-10 text-[#212121]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#3500A8] to-[#5C62DE] p-1 shadow-[0_28px_90px_rgba(53,0,168,0.22)]">
          <div className="rounded-[28px] bg-white/95 p-6 sm:p-10">
            <div className="flex w-fit rounded-2xl border border-[#D9DBFF] bg-white px-4 py-3 shadow-[0_18px_44px_rgba(32,45,76,0.12)]">
              <Image
                src="/tazki-logo.jpg"
                alt="Tazki"
                width={2029}
                height={929}
                priority
                className="h-16 w-44 object-contain sm:w-56"
              />
            </div>

            <h1 className="mt-8 text-4xl font-black tracking-[-0.05em] text-[#212121] sm:text-5xl">
              Ficha de cliente Tazki
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#404D6D] sm:text-lg">
              Ingresa el ID del negocio para abrir la ficha de cliente.
            </p>

            <form
              action="/ficha-cliente"
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <input
                name="id"
                placeholder="Ej: 59418649660"
                className="min-h-14 flex-1 rounded-2xl border border-[#C3C6FF] bg-white px-5 text-base font-semibold text-[#212121] outline-none transition placeholder:text-[#808BA7] focus:border-[#3500A8] focus:ring-4 focus:ring-[#D9DBFF]"
              />
              <button
                type="submit"
                className="min-h-14 rounded-2xl bg-[#3500A8] px-7 text-base font-extrabold text-white shadow-[0_18px_36px_rgba(53,0,168,0.24)] transition hover:bg-[#3F1EC9] focus:outline-none focus:ring-4 focus:ring-[#D9DBFF]"
              >
                Abrir ficha
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
