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
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
