import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { OwnerProjectCreateModal } from "../components/OwnerProjectCreateModal";
import { getOwnerPortfolio, type PortfolioRow } from "../lib/cde-data";

const PHASE_LABELS: Record<string, string> = {
  autorizacion_inicial: "Autorización inicial",
  anteproyecto: "Anteproyecto",
  revision_tecnica: "Revisión técnica",
  planos_tecnicos: "Planos técnicos",
  inicio_obra: "Inicio de obra",
  obra_activa: "Obra activa",
  cierre: "Cierre",
  archivo: "Archivo",
};

export function OwnerDashboard() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [portfolio, setPortfolio] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadPortfolio = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError("");
    try {
      setPortfolio(await getOwnerPortfolio(profile.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible cargar tus propiedades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPortfolio(); }, [profile?.id]);

  const openCreate = () => {
    if (!portfolio.length) return;
    setShowCreate(true);
  };

  useEffect(() => {
    if (searchParams.get("nuevo") === "1" && portfolio.length > 0 && !showCreate) openCreate();
  }, [searchParams, portfolio.length, showCreate]);

  const closeCreate = () => {
    setShowCreate(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("nuevo");
    setSearchParams(nextParams, { replace: true });
  };

  const handleProjectCreated = async (projectId: string) => {
    await loadPortfolio();
    closeCreate();
    navigate(`/propietario/mis-propiedades/${projectId}`);
  };

  return (
    <div className="px-4 md:px-10 py-8 md:py-12 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-secondary mb-3">Portal del propietario</p>
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight">Mis Propiedades</h1>
          <p className="text-base text-secondary mt-3">Historial, estado físico y documentos de tus propiedades autorizadas.</p>
        </div>
        <div className="text-right text-sm text-secondary"><p>Sesión activa</p><p className="font-semibold text-primary">{profile?.display_name ?? "Propietario"}</p></div>
      </div>

      {loading && <div className="glass-panel p-8 text-center text-secondary">Cargando inventario persistente…</div>}
      {error && <div className="glass-panel p-6 border border-error/30 text-error">{error}</div>}
      {!loading && !error && !portfolio.length && <div className="glass-panel p-10 text-center"><span className="material-symbols-outlined text-4xl text-warning mb-4">home_work</span><h2 className="text-2xl font-semibold text-on-surface">Aún no tienes propiedades autorizadas</h2><p className="mt-3 text-secondary">El Administrador General debe validar tu propiedad y activar tu membresía del CDE.</p></div>}

      {!loading && !error && portfolio.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {portfolio.map((property) => <PropertyCard key={property.id} property={property} onOpenProject={(projectId) => navigate(`/propietario/mis-propiedades/${projectId}`)} />)}
        </section>
      )}

      {showCreate && (
        <OwnerProjectCreateModal
          properties={portfolio}
          onClose={closeCreate}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}

function PropertyCard({ property, onOpenProject }: { key?: string; property: PortfolioRow; onOpenProject: (projectId: string) => void }) {
  return <article className="glass-panel overflow-hidden border border-outline-variant/30 rounded-[2rem] bg-white"><div className="h-44 bg-surface-container-low relative overflow-hidden"><img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85" alt={property.name} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" /><div className="absolute bottom-5 left-6 text-white"><p className="text-xs uppercase tracking-[0.2em] opacity-80">Propiedad registrada desde el día uno</p><h2 className="text-2xl font-bold mt-2">{property.name}</h2></div></div><div className="p-6 md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-secondary">{property.property_code}</p><p className="text-sm text-secondary mt-2 flex items-center gap-2"><span className="material-symbols-outlined text-base">location_on</span>{property.address ?? "Ubicación pendiente de registrar"}</p></div><span className="inline-flex items-center gap-2 rounded-full bg-success/10 text-success px-3 py-1.5 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-success" />{property.property_type === "terreno" ? "Lote vacío" : "Construcción existente"}</span></div><div className="mt-6 pt-5 border-t border-outline-variant/30 space-y-3">{property.projects.length ? property.projects.map((project) => <button type="button" key={project.id} onClick={() => onOpenProject(project.id)} className="w-full text-left rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4 hover:border-primary/40 transition-colors"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.14em] text-secondary">{project.project_code}</p><h3 className="text-base font-semibold text-on-surface mt-1">{project.title}</h3></div><span className="text-[11px] uppercase tracking-wider text-primary font-semibold">{PHASE_LABELS[project.phase] ?? project.phase}</span></div><Progress label="Avance físico" value={Number(project.progress_percent)} /></button>) : <div className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">Sin expediente de obra registrado todavía.</div>}</div></div></article>;
}

function Progress({ label, value }: { label: string; value: number }) {
  return <div className="mt-4"><div className="flex items-center justify-between text-sm mb-2"><span className="text-secondary">{label}</span><span className="font-bold text-on-surface">{value.toFixed(0)}%</span></div><div className="h-2 rounded-full bg-surface-container-low overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>;
}
