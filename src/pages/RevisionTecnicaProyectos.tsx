import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { getProjectsForUser } from "../lib/cde-data";
import type { ProjectRecord } from "../lib/cde-types";

const phaseLabels: Record<string, string> = { autorizacion_inicial: "Carta pendiente", anteproyecto: "Anteproyecto", planos_tecnicos: "Planos técnicos", inicio_obra: "Inicio de obra", obra_activa: "Obra activa", cierre: "Cierre" };

export function RevisionTecnicaProyectos() {
  const { profile } = useSession();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Todos");

  useEffect(() => { if (!profile?.id) return; getProjectsForUser(profile.id).then(setProjects).catch((reason) => setError(reason instanceof Error ? reason.message : "No fue posible cargar los expedientes.")).finally(() => setLoading(false)); }, [profile?.id]);

  const filtered = useMemo(() => projects.filter((project) => filter === "Todos" || phaseLabels[project.phase] === filter), [filter, projects]);
  const filters = ["Todos", "Carta pendiente", "Anteproyecto", "Planos técnicos"];

  return <div className="px-4 md:px-10 py-8 md:py-12 max-w-7xl mx-auto space-y-8"><div><p className="text-xs uppercase tracking-[0.22em] text-secondary">Bandeja persistente</p><h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mt-2">Proyectos en Revisión Técnica</h1><p className="text-base text-secondary mt-3">Revise cartas, anteproyectos y planos técnicos desde los expedientes reales.</p></div><div className="flex gap-2 overflow-x-auto pb-2">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap ${filter === item ? "bg-primary text-white" : "bg-white text-secondary border border-outline-variant/30"}`}>{item}</button>)}</div>{loading && <div className="glass-panel p-10 text-center text-secondary">Cargando expedientes…</div>}{error && <div className="glass-panel p-6 border border-error/30 text-error">{error}</div>}{!loading && !error && !filtered.length && <div className="glass-panel p-10 text-center text-secondary">No hay expedientes asignados para esta bandeja.</div>}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filtered.map((project) => <Link key={project.id} to={`/revision-tecnica/proyectos/${project.id}`} className="group rounded-3xl bg-white border border-outline-variant/30 p-6 soft-shadow hover:border-primary/40 transition-colors"><div className="flex items-start justify-between gap-4"><span className="text-xs uppercase tracking-[0.16em] text-secondary">{project.project_code}</span><span className="rounded-full bg-warning/10 text-warning px-3 py-1 text-[11px] font-semibold">{phaseLabels[project.phase] ?? project.phase}</span></div><h2 className="text-xl font-bold text-on-surface mt-4 group-hover:text-primary transition-colors">{project.title}</h2><div className="mt-6"><div className="flex justify-between text-xs mb-2"><span className="text-secondary">Avance físico</span><span className="font-semibold text-on-surface">{Number(project.progress_percent).toFixed(0)}%</span></div><div className="h-2 rounded-full bg-surface-container-low overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, Number(project.progress_percent)))}%` }} /></div></div><p className="text-sm text-primary font-semibold mt-6 inline-flex items-center gap-1">Abrir revisión <span className="material-symbols-outlined text-base">arrow_forward</span></p></Link>)}</div></div>;
}
