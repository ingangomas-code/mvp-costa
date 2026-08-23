import { useId, useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react";
import {
  createOwnerProjectWorkflow,
  uploadProjectDocument,
  type PortfolioRow,
} from "../lib/cde-data";

interface OwnerProjectCreateModalProps {
  properties: PortfolioRow[];
  onClose: () => void;
  onCreated: (projectId: string) => Promise<void> | void;
}

const MAX_AUTHORIZATION_SIZE = 50 * 1024 * 1024;

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function OwnerProjectCreateModal({
  properties,
  onClose,
  onCreated,
}: OwnerProjectCreateModalProps) {
  const fileInputId = useId();
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [architectEmail, setArchitectEmail] = useState("architect.demo@costasur.com");
  const [authorizationFile, setAuthorizationFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectAuthorization = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError("");
    if (!file) {
      setAuthorizationFile(null);
      return;
    }
    if (!isPdf(file)) {
      setAuthorizationFile(null);
      setError("La carta de autorización debe ser un archivo PDF.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AUTHORIZATION_SIZE) {
      setAuthorizationFile(null);
      setError("La carta de autorización supera el límite de 50 MB.");
      event.target.value = "";
      return;
    }
    setAuthorizationFile(file);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!propertyId || !architectEmail.trim() || !authorizationFile) {
      setError("Selecciona la propiedad, indica el correo del arquitecto y adjunta la carta.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const project = await createOwnerProjectWorkflow({
        propertyId,
        architectEmail: architectEmail.trim(),
      });
      await uploadProjectDocument({
        projectId: project.id,
        category: "autorizacion",
        title: `Carta de autorización — ${project.title}`,
        file: authorizationFile,
        visibleToOwner: true,
      });
      await onCreated(project.id);
    } catch (reason) {
      console.error("[OwnerProjectCreateModal] workflow creation failed", reason);
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "No fue posible crear el expediente y registrar la carta de autorización.",
      );
    } finally {
      setSaving(false);
    }
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !saving) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
      onMouseDown={closeFromBackdrop}
    >
      <form
        onSubmit={submit}
        className="glass-panel w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-5 border-b border-outline-variant/20 px-7 py-6 md:px-9">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">Nuevo expediente</p>
            <h2 id="new-project-title" className="mt-2 text-2xl font-bold text-on-surface">
              Iniciar una nueva obra
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Costasur generará el nombre y número del expediente automáticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-secondary transition-colors hover:bg-white/70 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5 px-7 py-7 md:px-9">
          <label className="block text-sm font-medium text-on-surface">
            Propiedad
            <select
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white/85 px-4 py-3 outline-none focus:border-primary"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.property_code} — {property.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-on-surface">
            Correo del arquitecto
            <input
              required
              type="email"
              value={architectEmail}
              onChange={(event) => setArchitectEmail(event.target.value)}
              placeholder="arquitecto@estudio.com"
              className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white/85 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-on-surface">Carta de autorización</p>
            <input
              id={fileInputId}
              required
              type="file"
              accept="application/pdf,.pdf"
              onChange={selectAuthorization}
              className="sr-only"
            />
            <div className="mt-2 rounded-2xl border border-dashed border-outline-variant/60 bg-white/55 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {authorizationFile?.name ?? "Ninguna carta adjunta"}
                  </p>
                  <p className="mt-1 text-xs text-secondary">PDF firmado · máximo 50 MB</p>
                </div>
                <label
                  htmlFor={fileInputId}
                  className="cursor-pointer rounded-full border border-outline-variant/50 bg-white px-4 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40"
                >
                  {authorizationFile ? "Cambiar" : "Adjuntar"}
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/20 bg-white/35 px-7 py-5 md:px-9">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-secondary hover:bg-white/70 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Enviando…" : "Iniciar obra"}
          </button>
        </div>
      </form>
    </div>
  );
}
