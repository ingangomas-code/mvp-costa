import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminProjects, getProjectsForUser } from "../lib/cde-data";
import type { ProjectRecord } from "../lib/cde-types";
import { useSession } from "../context/SessionContext";
import { CasaDeCampoMap } from "../components/CasaDeCampoMap";

const COLORS = ["#001e40", "#d18b00", "#0f766e", "#b42318", "#667085"];

const roleLabels: Record<string, string> = {
  admin: "Administrador General",
  arquitecto: "Arquitecto",
  contratista: "Contratista",
  "revision-tecnica": "Revisión Técnica",
  "control-obras": "Control de Obras",
  legal: "Departamento Legal",
  electrica: "Ingeniería Eléctrica",
  hidrosanitaria: "Ingeniería Hidrosanitaria",
  paisajismo: "Paisajismo",
  mensura: "Mensura",
  seguridad: "Seguridad",
};

const statusLabels: Record<string, string> = {
  obra_activa: "Obra activa",
  en_revision: "En revisión",
  pendiente_inspeccion: "Pendiente de inspección",
  obra_autorizada: "Obra autorizada",
  aprobado: "Aprobada",
  critica: "Crítica",
  paralizada: "Paralizada",
  finalizada: "Finalizada",
};

function shortTitle(value: string) {
  return value.length > 20 ? `${value.slice(0, 20)}…` : value;
}

function projectStatusData(projects: ProjectRecord[]) {
  return [
    { name: "Obra activa", value: projects.filter((project) => project.operational_status === "obra_activa").length },
    { name: "En revisión", value: projects.filter((project) => project.operational_status === "en_revision" || project.phase === "revision_tecnica").length },
    { name: "Inspección", value: projects.filter((project) => project.operational_status === "pendiente_inspeccion").length },
    { name: "Aprobado", value: projects.filter((project) => project.operational_status === "aprobado" || project.operational_status === "obra_autorizada").length },
    { name: "Finalizada", value: projects.filter((project) => project.operational_status === "finalizada").length },
  ].filter((group) => group.value > 0);
}

export function DashboardAnalytics({ role, showMap = false }: { role: string; showMap?: boolean }) {
  const { session } = useSession();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    setLoading(true);
    const request = role === "admin" ? getAdminProjects() : getProjectsForUser(session.user.id);
    void request
      .then((rows) => { if (active) setProjects(rows.filter((project) => project.operational_status !== "archivada")); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los expedientes."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role, session?.user.id]);

  const summary = useMemo(() => ({
    active: projects.filter((project) => project.operational_status === "obra_activa").length,
    review: projects.filter((project) => project.operational_status === "en_revision" || project.phase === "revision_tecnica").length,
    inspection: projects.filter((project) => project.operational_status === "pendiente_inspeccion").length,
    finalised: projects.filter((project) => project.operational_status === "finalizada").length,
    average: projects.length ? Math.round(projects.reduce((total, project) => total + Number(project.progress_percent || 0), 0) / projects.length) : 0,
  }), [projects]);

  const pieData = useMemo(() => projectStatusData(projects), [projects]);
  const barData = useMemo(() => projects.slice(0, 8).map((project) => ({ name: shortTitle(project.title), avance: Number(project.progress_percent || 0) })), [projects]);
  const title = roleLabels[role] ?? role.replaceAll("-", " ");
  const description = role === "admin" ? "Visión global de expedientes y operaciones persistidas en Costasur." : "Estado real de los expedientes asignados a este usuario o departamento.";

  return (
    <div className="min-h-full flex-1 overflow-y-auto bg-surface-container-low p-4 pt-8 md:p-10">
      <div className="mx-auto max-w-[1300px] space-y-8">
        <header><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">CDE Costasur</p><h2 className="mt-2 text-4xl font-bold tracking-tight text-on-surface md:text-5xl">Dashboard {title}</h2><p className="mt-2 text-lg text-secondary">{description}</p></header>
        {showMap && role === "revision-tecnica" && <CasaDeCampoMap title="Mapa GIS de Revisión Técnica" subtitle="Casa de Campo · La Romana · expedientes de revisión" heightClassName="h-[300px] md:h-[380px]" />}
        {showMap && role === "control-obras" && <CasaDeCampoMap title="Mapa GIS de Control de Obras" subtitle="Casa de Campo · La Romana · ubicación de expedientes" heightClassName="h-[300px] md:h-[380px]" />}
        {loading && <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-sm text-secondary">Cargando expedientes persistidos...</div>}
        {error && <div className="rounded-3xl border border-error/30 bg-error/10 p-8 text-sm text-error">{error}</div>}
        {!loading && !error && <>
          <section className="grid grid-cols-2 gap-4 md:grid-cols-5">{[["Expedientes", projects.length, "folder_open", "text-primary"], ["Obras activas", summary.active, "construction", "text-primary"], ["En revisión", summary.review, "rate_review", "text-warning"], ["Inspección", summary.inspection, "fact_check", "text-warning"], ["Avance físico", `${summary.average}%`, "trending_up", "text-success"]].map(([label, value, icon, tone]) => <div key={String(label)} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4"><span className={`material-symbols-outlined ${tone} text-[20px]`}>{icon}</span><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-secondary">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div>)}</section>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="glass-panel rounded-3xl border border-outline-variant/30 bg-white p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Datos persistentes</p><h3 className="mt-2 text-xl font-bold text-primary">Estado general</h3></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{projects.length} expedientes</span></div><div className="mt-5 h-[300px]">{pieData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="45%" innerRadius={62} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>{pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #d9dee7" }} /><Legend verticalAlign="bottom" height={32} /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl bg-surface-container-low text-sm text-secondary">Aún no hay expedientes activos para graficar.</div>}</div></div>
            <div className="glass-panel rounded-3xl border border-outline-variant/30 bg-white p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Avance físico</p><h3 className="mt-2 text-xl font-bold text-primary">Avance por expediente</h3></div><span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Sin balance financiero</span></div><div className="mt-5 h-[300px]">{barData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={barData} margin={{ top: 12, right: 12, left: -12, bottom: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e6ec" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 11 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, "Avance físico"]} contentStyle={{ borderRadius: "12px", border: "1px solid #d9dee7" }} /><Bar dataKey="avance" name="Avance físico" fill="#001e40" radius={[6, 6, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl bg-surface-container-low text-sm text-secondary">Aún no hay avances físicos registrados.</div>}</div></div>
          </section>
        </>}
      </div>
    </div>
  );
}
