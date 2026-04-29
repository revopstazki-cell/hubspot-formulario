import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-[28px] border border-violet-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(32,45,76,0.08)] sm:p-8">
      <div className="mb-7 flex gap-4">
        <div className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-violet-700" />
        <div>
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-neutral-900">
            {title}
          </h2>
        {description ? (
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              {description}
            </p>
        ) : null}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
