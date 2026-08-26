import type { RoleKey } from "./cde-types";

export interface DemoProfile {
  label: string;
  email: string;
  roleKey: RoleKey;
}

export const DEMO_PROFILES: DemoProfile[] = [
  { label: "Propietario", email: "owner.demo@costasur.com", roleKey: "propietario" },
  { label: "Departamento Legal", email: "legal.demo@costasur.com", roleKey: "legal" },
  { label: "Departamento de Arquitectura", email: "review.demo@costasur.com", roleKey: "revision_tecnica" },
  { label: "Arquitecto", email: "architect.demo@costasur.com", roleKey: "arquitecto" },
  { label: "Contratista", email: "contractor.demo@costasur.com", roleKey: "contratista" },
  { label: "Control de Obras", email: "control.demo@costasur.com", roleKey: "control_obras" },
  { label: "Electricidad", email: "electrica.demo@costasur.com", roleKey: "electrica" },
  { label: "Hidrosanitaria", email: "hidrosanitaria.demo@costasur.com", roleKey: "hidrosanitaria" },
  { label: "Paisajismo", email: "paisajismo.demo@costasur.com", roleKey: "paisajismo" },
  { label: "Mensura", email: "mensura.demo@costasur.com", roleKey: "mensura" },
  { label: "Seguridad", email: "seguridad.demo@costasur.com", roleKey: "seguridad" },
  { label: "Administración General", email: "admin.demo@costasur.com", roleKey: "admin_general" },
];

export const DEFAULT_DEMO_PROFILE = DEMO_PROFILES[0];
