import { useEffect, useMemo, useState } from "react";
import { DocumentUpload } from "../components/DocumentUpload";
import { ArchitectAnteprojectUploadPanel } from "../components/ArchitectAnteprojectUploadPanel";
import { DocumentViewer } from "../components/DocumentViewer";
import { getProjectsForUser, getProjectWorkspace, type ProjectWorkspace } from "../lib/cde-data";
import type { ProjectRecord } from "../lib/cde-types";
import { useSession } from "../context/SessionContext";

const technicalCategories = [
  { value: "arquitectonico", label: "Arquitectónico" },
  { value: "estructural", label: "Estructural" },
  { value: "electrico", label: "Eléctrico" },
  { value: "hidrosanitario", label: "Hidrosanitario" },
  { value: "climatizacion", label: "Climatización" },
];

const phaseLabels: Record<string, string> = {
  autorizacion_inicial: "Esperando aprobación de carta",
  anteproyecto: "Anteproyecto habilitado",
  planos_tecnicos: "Planos técnicos habilitados",
  inicio_obra: "Planos aprobados · esperando inicio de obra",
  obra_activa: "Obra activa",
};

export function ArchitectPortal() {
  const { profile } = useSession();
  const [activeTab, setActiveTab] = useState<"anteproyecto" | "planos_tecnicos" | "memoria_descriptiva">("anteproyecto");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [workspace, setWorkspace] = useState<ProjectWorkspace | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkspace = async (requestedProjectId?: string) => {
    if (!profile?.id) return;
    setLoading(true);
    setError("");
    try {
      const projectRows = await getProjectsForUser(profile.id);
      setProjects(projectRows);
      const id = requestedProjectId ?? projectId ?? projectRows[0]?.id ?? null;
      setProjectId(id);
      if (!id) { setWorkspace(null); return; }
      const nextWorkspace = await getProjectWorkspace(id);
      setWorkspace(nextWorkspace);
      setSelectedDocumentId((current) => current && nextWorkspace.documents.some((document) => document.id === current) ? current : nextWorkspace.documents[0]?.id ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible cargar los expedientes del arquitecto.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadWorkspace(); }, [profile?.id]);

  const phase = workspace?.project.phase ?? "autorizacion_inicial";
  const anteprojectEnabled = phase !== "autorizacion_inicial";
  const technicalEnabled = ["planos_tecnicos", "inicio_obra", "obra_activa", "cierre"].includes(phase);
  const visibleDocuments = useMemo(() => {
    if (!workspace) return [];
    if (activeTab === "anteproyecto") return workspace.documents.filter((document) => ["anteproyecto", "planta_conjunto", "planta_nivel", "elevaciones", "secciones", "curvas_nivel", "memoria_descriptiva", "anexos"].includes(document.category));
    if (activeTab === "memoria_descriptiva") return workspace.documents.filter((document) => document.category === "memoria_descriptiva");
    return workspace.documents.filter((document) => technicalCategories.some((category) => category.value === document.category));
  }, [activeTab, workspace]);

  useEffect(() => {
    if (visibleDocuments.length && !visibleDocuments.some((document) => document.id === selectedDocumentId)) setSelectedDocumentId(visibleDocuments[0].id);
  }, [selectedDocumentId, visibleDocuments]);

  if (loading) return <div className="flex-1 overflow-y-auto p-10 bg-surface-container-low"><div className="glass-panel p-10 text-center text-secondary">Cargando expediente arquitectónico…</div></div>;
  if (error) return <div className="flex-1 overflow-y-auto p-10 bg-surface-container-low"><div className="glass-panel p-8 border border-error/30 text-error">{error}</div></div>;
  if (!workspace || !projectId) return <div className="flex-1 overflow-y-auto p-10 bg-surface-container-low"><div className="glass-panel p-10 text-center"><span className="material-symbols-outlined text-4xl text-warning">folder_off</span><h1 className="text-2xl font-bold text-on-surface mt-4">No hay expediente arquitectónico asignado</h1><p className="text-secondary mt-2">El propietario o el Administrador General debe crear y asignar un proyecto antes de iniciar el sometimiento.</p></div></div>;

  return <div className="flex-1 overflow-y-auto p-4 md:p-10 pt-8 bg-surface-container-low min-h-full"><div className="max-w-[1200px] mx-auto space-y-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-secondary">Expediente arquitectónico persistente</p><h1 className="text-4xl md:text-5xl font-bold text-on-surface mt-2">{workspace.project.title}</h1><p className="text-sm text-secondary mt-3">{workspace.project.project_code} · {workspace.property?.name ?? "Propiedad CDE"}</p></div><div className="flex flex-col items-stretch md:items-end gap-3"><span className="rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-semibold">{phaseLabels[phase] ?? phase}</span>{projects.length > 1 && <select value={projectId ?? ""} onChange={(event) => void loadWorkspace(event.target.value)} className="rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm text-on-surface"><option value="">Seleccionar expediente</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.project_code} · {project.title}</option>)}</select>}</div></div>
    <section className="glass-panel bg-white p-6 md:p-7 border border-outline-variant/30"><div className="flex items-start gap-4"><span className="material-symbols-outlined text-3xl text-primary">account_tree</span><div><p className="text-xs uppercase tracking-[0.18em] text-secondary">Gate del workflow</p><h2 className="text-xl font-bold text-on-surface mt-2">{phase === "autorizacion_inicial" ? "La carta aún debe ser aprobada por Revisión Técnica" : phase === "anteproyecto" ? "Puede someter el anteproyecto" : phase === "planos_tecnicos" ? "Puede someter los planos técnicos" : "El expediente avanzó a la etapa de inicio de obra"}</h2><p className="text-sm text-secondary mt-2">Los documentos y revisiones se guardan en Supabase. La revisión asistida por IA continúa señalizada como futura y no ejecuta análisis.</p></div></div></section>
    <div className="flex flex-col md:flex-row gap-2 p-1 bg-surface-container-low rounded-xl border border-outline-variant/20"><TabButton active={activeTab === "anteproyecto"} disabled={!anteprojectEnabled} onClick={() => setActiveTab("anteproyecto")} label="Anteproyecto" /><TabButton active={activeTab === "planos_tecnicos"} disabled={!technicalEnabled} onClick={() => setActiveTab("planos_tecnicos")} label="Planos técnicos" /><TabButton active={activeTab === "memoria_descriptiva"} disabled={!anteprojectEnabled} onClick={() => setActiveTab("memoria_descriptiva")} label="Memoria descriptiva" /></div>
    {activeTab === "anteproyecto" && anteprojectEnabled && <ArchitectAnteprojectUploadPanel projectId={projectId} onUploaded={() => { void loadWorkspace(projectId ?? undefined); }} />}
    {activeTab === "memoria_descriptiva" && anteprojectEnabled && <DocumentUpload projectId={projectId} defaultCategory="memoria_descriptiva" categories={[{ value: "memoria_descriptiva", label: "Memoria descriptiva" }]} accept=".pdf,.doc,.docx" onUploaded={() => { void loadWorkspace(projectId ?? undefined); }} />}
    {activeTab === "planos_tecnicos" && technicalEnabled && <DocumentUpload projectId={projectId} defaultCategory={technicalCategories[0].value} categories={technicalCategories} accept=".pdf,.dwg,.dxf" onUploaded={() => { void loadWorkspace(projectId ?? undefined); }} />}
    {activeTab === "planos_tecnicos" && !technicalEnabled && <GateNotice title="Planos técnicos bloqueados" body="Revisión Técnica debe aprobar el anteproyecto antes de habilitar los planos técnicos." />}
    {activeTab !== "planos_tecnicos" && !anteprojectEnabled && <GateNotice title="Sometimiento bloqueado" body="La carta de autorización debe ser aprobada por Revisión Técnica antes de habilitar este expediente." />}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><section className="glass-panel bg-white p-6 border border-outline-variant/30 lg:col-span-1"><p className="text-xs uppercase tracking-[0.18em] text-secondary">Documentos disponibles</p><h2 className="text-xl font-bold text-on-surface mt-2">{visibleDocuments.length} registros</h2><div className="space-y-2 mt-5">{visibleDocuments.length ? visibleDocuments.map((document) => <button type="button" key={document.id} onClick={() => setSelectedDocumentId(document.id)} className={`w-full text-left rounded-xl border p-3 transition-colors ${selectedDocumentId === document.id ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/30"}`}><p className="text-sm font-semibold text-on-surface truncate">{document.title}</p><p className="text-xs text-secondary mt-1 uppercase">{document.category.replaceAll("_", " ")} · {document.cde_state}</p></button>) : <p className="text-sm text-secondary">Todavía no hay documentos en esta etapa.</p>}</div></section><div className="lg:col-span-2">{selectedDocumentId ? <DocumentViewer documentId={selectedDocumentId} /> : <div className="glass-panel p-10 text-center text-secondary">Selecciona un documento versionado para abrir el visor PDF o CAD.</div>}</div></div>
  </div></div>;
}

function TabButton({ active, disabled, onClick, label }: { active: boolean; disabled: boolean; onClick: () => void; label: string }) { return <button type="button" disabled={disabled} onClick={onClick} className={`flex-1 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${active ? "bg-white shadow-sm text-primary" : "text-secondary hover:text-primary"} disabled:opacity-40 disabled:cursor-not-allowed`}>{label}{disabled && <span className="material-symbols-outlined text-sm align-middle ml-2">lock</span>}</button>; }
function GateNotice({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 flex items-start gap-3"><span className="material-symbols-outlined text-warning">lock</span><div><h3 className="font-semibold text-on-surface">{title}</h3><p className="text-sm text-secondary mt-1">{body}</p></div></div>; }
