type FileUploadProps = {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  fileName?: string;
  existingValue?: string;
  onChange: (file: File | null) => void;
};

export function FileUpload({
  label,
  required,
  error,
  helperText,
  fileName,
  existingValue,
  onChange,
}: FileUploadProps) {
  return (
    <label className="flex flex-col gap-2 md:col-span-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
        <input
          type="file"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#7B3FF2] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {fileName ? (
          <p className="mt-3 text-sm text-slate-600">Archivo seleccionado: {fileName}</p>
        ) : null}
        {existingValue ? (
          <p className="mt-3 text-sm text-slate-600">
            Archivo existente:{" "}
            {existingValue.startsWith("http") ? (
              <a
                href={existingValue}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#7B3FF2] underline-offset-4 hover:underline"
              >
                Ver archivo
              </a>
            ) : (
              <span className="font-mono text-xs">{existingValue}</span>
            )}
          </p>
        ) : null}
      </div>
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}
