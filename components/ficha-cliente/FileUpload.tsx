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
      <span className="text-sm font-bold text-neutral-800">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <div className="rounded-3xl border border-dashed border-violet-300 bg-violet-050 p-5">
        <input
          type="file"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="block w-full text-sm font-medium text-neutral-700 file:mr-4 file:rounded-2xl file:border-0 file:bg-violet-900 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-violet-800"
        />
        {fileName ? (
          <p className="mt-3 text-sm font-medium text-neutral-700">
            Archivo seleccionado: {fileName}
          </p>
        ) : null}
        {existingValue ? (
          <p className="mt-3 text-sm font-medium text-neutral-700">
            Archivo existente:{" "}
            {existingValue.startsWith("http") ? (
              <a
                href={existingValue}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-violet-900 underline-offset-4 hover:underline"
              >
                Ver archivo
              </a>
            ) : (
              <span className="font-mono text-xs text-neutral-700">
                {existingValue}
              </span>
            )}
          </p>
        ) : null}
      </div>
      {error ? (
        <span className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </span>
      ) : null}
      {!error && helperText ? (
        <span className="text-xs font-medium text-neutral-600">{helperText}</span>
      ) : null}
    </label>
  );
}
