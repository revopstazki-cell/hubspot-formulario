type SelectOption = {
  label: string;
  value: string;
};

type SelectInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

const baseClassName =
  "w-full rounded-2xl border border-neutral-300 bg-neutral-050/80 px-4 py-3.5 text-[15px] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-violet-700 focus:bg-white focus:ring-4 focus:ring-violet-200/70 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

const errorClassName =
  "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-100";

export function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
  required,
  disabled,
  error,
}: SelectInputProps) {
  const selectClassName = error
    ? `${baseClassName} ${errorClassName}`
    : baseClassName;

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-neutral-800">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={selectClassName}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
