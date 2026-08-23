import { useState, type FormEvent } from "react";
import { authorizeContractorForProject } from "../lib/cde-data";
import { useSession } from "../context/SessionContext";

export function ContractorAuthorizationPanel({ projectId, phase }: { projectId: string; phase: string }) {
  const { primaryRole } = useSession();
  const [email, setEmail] = useState("contractor.demo@costasur.com");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  if (primaryRole !== "propietario") return null;
  const enabled = ["inicio_obra", "obra_activa", "cierre"].includes(phase);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!enabled || !email.trim()) return;
    setBusy(true); setFeedback(""); setError("");
    try {
      await authorizeContractorForProject({ projectId, contractorEmail: email.trim() });
      setFeedback("Contratista autorizado. Ya puede enviar la solicitud de inicio de obra desde su portal.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible autorizar al contratista.");
    } finally { setBusy(false); }
  };

  return <section className="glass-panel p-6 md:p-7 border border-outline-variant/30"><div className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-3xl">engineering</span><div><p className="text-xs uppercase tracking-[0.18em] text-secondary">Autorización de ejecución</p><h2 className="text-xl font-bold text-on-surface mt-2">Autorizar contratista</h2><p className="text-sm text-secondary mt-2">Disponible cuando Revisión Técnica haya aprobado los planos técnicos del expediente.</p></div></div>{!enabled && <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">La autorización estará disponible después de la aprobación completa de planos técnicos.</p>}{enabled && <form onSubmit={submit} className="mt-5 flex flex-col md:flex-row gap-3"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="flex-1 rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none focus:border-primary" placeholder="contratista@costasur.com" /><button type="submit" disabled={busy} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Autorizando…" : "Autorizar contratista"}</button></form>}{error && <p className="mt-3 text-sm text-error">{error}</p>}{feedback && <p className="mt-3 text-sm text-success">{feedback}</p>}</section>;
}
