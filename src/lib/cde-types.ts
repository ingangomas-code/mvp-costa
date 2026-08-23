export const ROLE_KEYS = [
  "admin_general",
  "propietario",
  "arquitecto",
  "contratista",
  "revision_tecnica",
  "control_obras",
  "legal",
  "electrica",
  "hidrosanitaria",
  "paisajismo",
  "mensura",
  "seguridad",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLE_LABELS: Record<RoleKey, string> = {
  admin_general: "Administrador General",
  propietario: "Propietario",
  arquitecto: "Arquitecto / Tramitador",
  contratista: "Contratista / Constructor",
  revision_tecnica: "Revisión Técnica",
  control_obras: "Control de Obras",
  legal: "Legal",
  electrica: "Electricidad",
  hidrosanitaria: "Hidrosanitaria",
  paisajismo: "Paisajismo",
  mensura: "Mensura",
  seguridad: "Seguridad",
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  arquitectura: "Revisión Técnica",
  revision_tecnica: "Revisión Técnica",
  control_obras: "Control de Obras",
  legal: "Legal",
  electrica: "Electricidad",
  hidrosanitaria: "Hidrosanitaria",
  paisajismo: "Paisajismo",
  mensura: "Mensura",
  seguridad: "Seguridad",
};

export type CDEState = "wip" | "shared" | "published" | "archive";
export type OperationalStatus = "en_revision" | "aprobado" | "pendiente_inspeccion" | "obra_autorizada" | "obra_activa" | "critica" | "paralizada" | "finalizada" | "archivada";
export type ProjectPhase = "autorizacion_inicial" | "anteproyecto" | "revision_tecnica" | "directorio" | "planos_tecnicos" | "inicio_obra" | "obra_activa" | "cierre" | "archivo";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  phone?: string | null;
  status: "pending" | "active" | "suspended";
  is_demo: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_key: RoleKey;
  department_id?: string | null;
  is_active: boolean;
}

export interface PropertyRecord {
  id: string;
  property_code: string;
  property_type: "terreno" | "villa" | "vivienda";
  name: string;
  address?: string | null;
  owner_user_id?: string | null;
  area_m2?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: "active" | "archived" | "pending_validation";
}

export interface ProjectRecord {
  id: string;
  property_id: string;
  project_code: string;
  title: string;
  project_type: string;
  phase: ProjectPhase;
  cde_status: CDEState;
  operational_status: OperationalStatus;
  progress_percent: number;
  
  start_date?: string | null;
  target_end_date?: string | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  membership_role: "propietario" | "arquitecto" | "contratista" | "revisor" | "control_obras" | "observador";
  department_id?: string | null;
  status: "pending" | "active" | "revoked";
}

export interface DocumentRecord {
  id: string;
  project_id: string;
  category: string;
  title: string;
  description?: string | null;
  cde_state: CDEState;
  visible_to_owner: boolean;
  current_version_id?: string | null;
  created_by: string;
}

export interface UserContext {
  profile: Profile | null;
  roles: UserRole[];
  primaryRole: RoleKey | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  cde_state: CDEState;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentAnnotation {
  id: string;
  document_version_id: string;
  author_id: string;
  page_number: number;
  annotation_type: "comment" | "highlight" | "rectangle" | "note" | "marker";
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  content?: string | null;
  visibility: "internal" | "project_members" | "published";
  status: "open" | "resolved" | "archived";
  created_at: string;
}
