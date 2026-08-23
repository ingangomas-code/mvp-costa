import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { WorkflowReviewPanel } from "../components/WorkflowReviewPanel";
import { getProjectWorkspace, type ProjectWorkspace } from "../lib/cde-data";

const phaseLabels: Record<string, string> = { autorizacion_inicial: "Autorización inicial", anteproyecto: "Anteproyecto", planos_tecnicos: "Planos técnicos", inicio_obra: "Inicio de obra", obra_activa: "Obra activa", cierre: "Cierre" };

export function RevisionTecnicaProjectDetails() {
  const { id } = useParams();
  const [workspace, setWorkspace] = useState<ProjectWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getProjectWorkspace(id).then(setWorkspace).catch((reason) => setError(reason instanceof Error ? reason.message : "No fue posible cargar el expediente.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-secondary">Cargando expediente de revisión…</div>;
  if (error || !workspace || !id) return <div className="p-10 max-w-3xl mx-auto"><Link to="/revision-tecnica/proyectos" className="text-primary hover:underline">← Volver a revisión</Link><div className="glass-panel mt-6 p-8 border border-error/30 text-error">{error || "Expediente no disponible."}</div></div>;

  return <div className="px-4 md:px-10 py-8 md:py-12 max-w-7xl mx-auto space-y-8"><div><Link to="/revision-tecnica/proyectos" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-medium text-sm mb-5"><span className="material-symbols-outlined text-[20px]">arrow_back</span>Volver a proyectos</Link><div className="flex flex-col md:flex-row md:items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.22em] text-secondary">Revisión Técnica</p><h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mt-2">{workspace.project.title}</h1><p className="text-base text-secondary mt-3">{workspace.project.project_code} · {workspace.property?.name ?? "Propiedad CDE"}</p></div><span className="inline-flex items-center gap-2 rounded-full bg-warning/10 text-warning px-4 py-2 text-xs font-semibold uppercase tracking-wider">{phaseLabels[workspace.project.phase] ?? workspace.project.phase}</span></div></div><WorkflowReviewPanel projectId={id} /></div>;
}
