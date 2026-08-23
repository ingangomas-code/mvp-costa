import { lazy, Suspense, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPdfAnnotation, getDocumentViewerData } from "../lib/cde-data";
import type { DocumentAnnotation, DocumentVersion } from "../lib/cde-types";
import { useSession } from "../context/SessionContext";
import { CadViewer } from "./CadViewer";

const PdfDocumentCanvas = lazy(() => import("./PdfDocumentCanvas"));

interface DocumentViewerProps {
  documentId: string;
}

type DocumentKind = "pdf" | "image" | "cad" | "download";

function documentKind(version: DocumentVersion): DocumentKind {
  const filename = version.original_filename.toLowerCase();
  if (version.mime_type === "application/pdf" || filename.endsWith(".pdf")) return "pdf";
  if (version.mime_type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(filename)) return "image";
  if (/\.(dwg|dxf)$/i.test(filename)) return "cad";
  return "download";
}

function OpenDocumentLink({ url, label = "Abrir original" }: { url: string; label?: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40">
      <span className="material-symbols-outlined text-base">open_in_new</span>
      {label}
    </a>
  );
}

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const { profile } = useSession();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [title, setTitle] = useState("Documento");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [draft, setDraft] = useState<{ x: number; y: number; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewerError, setViewerError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setViewerError("");
    setNumPages(0);
    setPageNumber(1);
    setAnnotationMode(false);
    setDraft(null);

    getDocumentViewerData(documentId)
      .then((data) => {
        if (!active) return;
        setTitle(data.document.title);
        setSignedUrl(data.signedUrl);
        setVersion(data.version);
        setAnnotations(data.annotations);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "No fue posible abrir el documento.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [documentId]);

  const handlePageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || viewerError) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setDraft({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      content: "",
    });
  };

  const saveAnnotation = async () => {
    if (!draft || !version || !profile?.id || !draft.content.trim()) return;
    setSaving(true);
    try {
      const saved = await createPdfAnnotation({
        documentVersionId: version.id,
        authorId: profile.id,
        pageNumber,
        x: draft.x,
        y: draft.y,
        content: draft.content.trim(),
      });
      setAnnotations((current) => [...current, saved]);
      setDraft(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible guardar la anotación.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="glass-panel p-8 text-center text-secondary">Preparando visor documental…</div>;
  if (error) return <div className="glass-panel border border-error/30 p-8 text-error">{error}</div>;
  if (!signedUrl || !version) {
    return (
      <div className="glass-panel p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-secondary">upload_file</span>
        <h2 className="mt-4 text-xl font-semibold text-on-surface">{title}</h2>
        <p className="mt-2 text-secondary">Este registro todavía no tiene una versión de archivo cargada.</p>
      </div>
    );
  }

  const kind = documentKind(version);

  if (kind === "cad") {
    return (
      <section className="glass-panel border border-outline-variant/30 p-5 md:p-7">
        <DocumentHeading title={title} version={version} action={<OpenDocumentLink url={signedUrl} />} />
        <CadViewer url={signedUrl} filename={version.original_filename} />
      </section>
    );
  }

  if (kind === "image") {
    return (
      <section className="glass-panel border border-outline-variant/30 p-5 md:p-7">
        <DocumentHeading title={title} version={version} action={<OpenDocumentLink url={signedUrl} />} />
        <div className="overflow-auto rounded-2xl bg-surface-container-low p-4">
          <img src={signedUrl} alt={title} className="mx-auto max-h-[780px] max-w-full rounded-xl object-contain" />
        </div>
      </section>
    );
  }

  if (kind === "download") {
    return (
      <section className="glass-panel border border-outline-variant/30 p-5 md:p-7">
        <DocumentHeading title={title} version={version} />
        <div className="rounded-2xl bg-surface-container-low p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">draft</span>
          <h3 className="mt-4 text-xl font-bold text-on-surface">Vista previa no disponible</h3>
          <p className="mt-2 text-sm text-secondary">Este formato permanece versionado y puede abrirse con su aplicación correspondiente.</p>
          <div className="mt-5 flex justify-center"><OpenDocumentLink url={signedUrl} label="Abrir archivo" /></div>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel border border-outline-variant/30 p-5 md:p-7">
      <DocumentHeading
        title={title}
        version={version}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <OpenDocumentLink url={signedUrl} />
            <button
              type="button"
              onClick={() => {
                setAnnotationMode((value) => !value);
                setDraft(null);
              }}
              disabled={Boolean(viewerError)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${annotationMode ? "border-primary bg-primary text-white" : "border-outline-variant/50 text-primary hover:bg-primary/5"}`}
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              {annotationMode ? "Modo anotación activo" : "Añadir anotación"}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between text-sm text-secondary">
        <span>Página {pageNumber} de {numPages || "…"}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))} className="rounded-full p-2 hover:bg-surface-container-low disabled:opacity-40" aria-label="Página anterior"><span className="material-symbols-outlined">chevron_left</span></button>
          <button type="button" disabled={!numPages || pageNumber >= numPages} onClick={() => setPageNumber((value) => Math.min(numPages, value + 1))} className="rounded-full p-2 hover:bg-surface-container-low disabled:opacity-40" aria-label="Página siguiente"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl bg-surface-container-low p-4">
        {viewerError ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-error">broken_image</span>
            <h3 className="mt-4 text-lg font-bold text-on-surface">No fue posible mostrar el PDF</h3>
            <p className="mt-2 text-sm text-secondary">{viewerError}</p>
            <div className="mt-5 flex justify-center"><OpenDocumentLink url={signedUrl} /></div>
          </div>
        ) : (
          <div className="relative mx-auto w-fit cursor-crosshair" onClick={handlePageClick}>
            <Suspense fallback={<div className="p-16 text-secondary">Preparando visor PDF…</div>}>
              <PdfDocumentCanvas
                file={signedUrl}
                pageNumber={pageNumber}
                onPageCount={setNumPages}
                onError={(reason) => setViewerError(reason.message || "El archivo no pudo renderizarse.")}
              />
            </Suspense>
            {annotations.filter((annotation) => annotation.page_number === pageNumber).map((annotation) => (
              <div key={annotation.id} className="absolute z-10 max-w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-warning px-3 py-2 text-xs font-medium text-[#321b00] shadow-lg" style={{ left: `${annotation.x ?? 0}%`, top: `${annotation.y ?? 0}%` }}>
                <span className="material-symbols-outlined mr-1 align-middle text-sm">comment</span>{annotation.content}
              </div>
            ))}
            {draft && (
              <div className="absolute z-20 w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/30 bg-white p-3 shadow-xl" style={{ left: `${draft.x}%`, top: `${draft.y}%` }} onClick={(event) => event.stopPropagation()}>
                <textarea autoFocus value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Escribe el comentario" className="min-h-20 w-full rounded-xl border border-outline-variant/40 p-2 text-sm text-on-surface outline-none focus:border-primary" />
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setDraft(null)} className="px-3 py-1.5 text-xs text-secondary">Cancelar</button>
                  <button type="button" disabled={saving || !draft.content.trim()} onClick={saveAnnotation} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Guardando…" : "Guardar"}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-secondary">Las anotaciones se guardan como una capa independiente vinculada a la versión, página y autor.</p>
    </section>
  );
}

function DocumentHeading({ title, version, action }: { title: string; version: DocumentVersion; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-secondary">Visor documental</p>
        <h2 className="mt-2 text-2xl font-bold text-on-surface">{title}</h2>
        <p className="mt-1 text-sm text-secondary">Versión {version.version_number} · {version.original_filename}</p>
      </div>
      {action}
    </div>
  );
}
