type TextInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date";
  required?: boolean;
  disabled?: boolean;
  error?: string;
  multiline?: boolean;
  helperText?: string;
};

const baseClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7B3FF2] focus:ring-2 focus:ring-[#7B3FF2]/15";

export function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  disabled,
  error,
  multiline,
  helperText,
}: TextInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={baseClassName}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={baseClassName}
        />
      )}
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}
