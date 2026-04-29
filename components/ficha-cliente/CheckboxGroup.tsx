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
      <span className="text-sm font-bold text-neutral-800">{label}</span>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-050 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-violet-300 hover:bg-violet-050"
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => toggleValue(option.value)}
              className="h-4 w-4 rounded border-neutral-300 accent-violet-900 focus:ring-violet-900"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <span className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}
