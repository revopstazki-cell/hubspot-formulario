type CheckboxOption = {
  label: string;
  value: string;
};

type CheckboxGroupProps = {
  label: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
};

export function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  error,
}: CheckboxGroupProps) {
  function toggleValue(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  }

  return (
    <div className="flex flex-col gap-3 md:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => toggleValue(option.value)}
              className="h-4 w-4 rounded border-slate-300 text-[#7B3FF2] focus:ring-[#7B3FF2]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </div>
  );
}
