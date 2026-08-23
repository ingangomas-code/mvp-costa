import { requireSupabase } from "./supabase";
import type { DocumentAnnotation, DocumentRecord, DocumentVersion, ProjectMember, ProjectRecord, PropertyRecord } from "./cde-types";

export interface PortfolioRow extends PropertyRecord {
  projects: ProjectRecord[];
}

export interface ProjectWorkspace {
  project: ProjectRecord;
  property: PropertyRecord | null;
  documents: DocumentRecord[];
  events: Array<{ id: string; event_type: string; comment: string | null; created_at: string; actor_role: string | null }>;
}

export async function getOwnerPortfolio(userId: string): Promise<PortfolioRow[]> {
  const client = requireSupabase();
  const { data: properties, error: propertyError } = await client
    .from("properties")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true });
  if (propertyError) throw propertyError;
  const propertyRows = (properties ?? []) as PropertyRecord[];
  if (!propertyRows.length) return [];
  const { data: projects, error: projectError } = await client
    .from("projects")
    .select("*")
.in("property_id", propertyRows.map((property) => property.id))
    .neq("operational_status", "archivada")
    .order("created_at", { ascending: true });
  if (projectError) throw projectError;
  const projectRows = (projects ?? []) as ProjectRecord[];
  return propertyRows.map((property) => ({
    ...property,
    projects: projectRows.filter((project) => project.property_id === property.id),
  }));
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspace> {
  const client = requireSupabase();
  const { data: project, error: projectError } = await client
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("El proyecto solicitado no existe o no está disponible para este usuario.");
  const typedProject = project as ProjectRecord;
  const [{ data: property }, { data: documents }, { data: events }] = await Promise.all([
    client.from("properties").select("*").eq("id", typedProject.property_id).maybeSingle(),
    client.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    client.from("workflow_events").select("id,event_type,comment,created_at,actor_role").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
  ]);
  return {
    project: typedProject,
    property: (property as PropertyRecord | null) ?? null,
    documents: (documents as DocumentRecord[] | null) ?? [],
    events: events ?? [],
  };
}

export async function getAdminProjects(): Promise<ProjectRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("projects").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectRecord[];
}

export function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(new Date(value));
}


export async function getDocumentViewerData(documentId: string) {
  const client = requireSupabase();
  const { data: document, error: documentError } = await client.from("documents").select("*").eq("id", documentId).maybeSingle();
  if (documentError) throw documentError;
  if (!document) throw new Error("Documento no disponible para este usuario.");
  const { data: versions, error: versionsError } = await client.from("document_versions").select("*").eq("document_id", documentId).order("version_number", { ascending: false });
  if (versionsError) throw versionsError;
  const current = (versions as DocumentVersion[] | null)?.[0] ?? null;
  if (!current) return { document: document as DocumentRecord, version: null, signedUrl: null, annotations: [] as DocumentAnnotation[] };
  const { data: signed, error: signedError } = await client.storage.from("cde-documents").createSignedUrl(current.storage_path, 3600);
  if (signedError) throw signedError;
  const { data: annotations, error: annotationsError } = await client.from("document_annotations").select("*").eq("document_version_id", current.id).order("created_at", { ascending: true });
  if (annotationsError) throw annotationsError;
  return { document: document as DocumentRecord, version: current, signedUrl: signed.signedUrl, annotations: (annotations ?? []) as DocumentAnnotation[] };
}

export async function createPdfAnnotation(input: { documentVersionId: string; authorId: string; pageNumber: number; x: number; y: number; content: string }) {
  const client = requireSupabase();
  const { data, error } = await client.from("document_annotations").insert({ document_version_id: input.documentVersionId, author_id: input.authorId, page_number: input.pageNumber, annotation_type: "comment", x: input.x, y: input.y, content: input.content, visibility: "project_members", status: "open" }).select("*").single();
  if (error) throw error;
  return data as DocumentAnnotation;
}

export async function getFirstProjectForUser(userId: string) {
  const projects = await getProjectsForUser(userId);
  return projects[0]?.id ?? null;
}


export interface GovernanceDepartment {
  id: string;
  slug: string;
  name: string;
}

export interface GovernanceRole {
  id: string;
  user_id: string;
  role_key: string;
  department_id?: string | null;
  is_active: boolean;
  granted_at?: string | null;
  department?: GovernanceDepartment | null;
}

export interface GovernanceMembership {
  id: string;
  project_id: string;
  user_id: string;
  membership_role: string;
  department_id?: string | null;
  status: "pending" | "active" | "revoked";
  created_at?: string | null;
  project?: { id: string; project_code: string; title: string } | null;
  department?: GovernanceDepartment | null;
}

export interface AdminGovernanceUser {
  id: string;
  email: string;
  display_name: string;
  phone?: string | null;
  status: "pending" | "active" | "suspended";
  is_demo: boolean;
  created_at: string;
  roles: GovernanceRole[];
  memberships: GovernanceMembership[];
}

export async function getAdminGovernance(): Promise<AdminGovernanceUser[]> {
  const client = requireSupabase();
  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    client.from("profiles").select("id,email,display_name,phone,status,is_demo,created_at").order("created_at", { ascending: false }),
    client.from("user_roles").select("id,user_id,role_key,department_id,is_active,granted_at,departments(id,slug,name)").order("granted_at", { ascending: false }),
    client.from("project_members").select("id,project_id,user_id,membership_role,department_id,status,created_at,projects(id,project_code,title),departments(id,slug,name)").order("created_at", { ascending: false }),
  ]);
  if (profilesError) throw profilesError;
  if (rolesError) throw rolesError;
  if (membershipsError) throw membershipsError;
  const roleRows = (roles ?? []) as unknown as Array<GovernanceRole & { departments?: GovernanceDepartment | GovernanceDepartment[] | null }>;
  const membershipRows = (memberships ?? []) as unknown as Array<GovernanceMembership & { projects?: GovernanceMembership["project"] | Array<NonNullable<GovernanceMembership["project"]>>; departments?: GovernanceDepartment | GovernanceDepartment[] | null }>;
  return ((profiles ?? []) as Array<Omit<AdminGovernanceUser, "roles" | "memberships">>).map((profile) => ({
    ...profile,
    roles: roleRows.filter((role) => role.user_id === profile.id).map(({ departments, ...role }) => ({ ...role, department: Array.isArray(departments) ? departments[0] ?? null : departments ?? null })),
    memberships: membershipRows.filter((membership) => membership.user_id === profile.id).map(({ projects, departments, ...membership }) => ({ ...membership, project: Array.isArray(projects) ? projects[0] ?? null : projects ?? null, department: Array.isArray(departments) ? departments[0] ?? null : departments ?? null })),
  }));
}

export async function updateProfileStatus(userId: string, status: AdminGovernanceUser["status"]) {
  const client = requireSupabase();
  const { error } = await client.from("profiles").update({ status }).eq("id", userId);
  if (error) throw error;
}

export async function addUserRole(input: { userId: string; roleKey: string; departmentId?: string | null; grantedBy: string }) {
  const client = requireSupabase();
  const { error } = await client.from("user_roles").insert({ user_id: input.userId, role_key: input.roleKey, department_id: input.departmentId || null, granted_by: input.grantedBy, is_active: true });
  if (error) throw error;
}

export async function activateUserRole(roleId: string) {
  const client = requireSupabase();
  const { error } = await client.from("user_roles").update({ is_active: true }).eq("id", roleId);
  if (error) throw error;
}

export async function deactivateUserRole(roleId: string) {
  const client = requireSupabase();
  const { error } = await client.from("user_roles").update({ is_active: false }).eq("id", roleId);
  if (error) throw error;
}

export async function updateMembershipStatus(input: { membershipId: string; status: GovernanceMembership["status"]; approvedBy?: string }) {
  const client = requireSupabase();
  const payload: Record<string, unknown> = { status: input.status };
  if (input.status === "active" && input.approvedBy) payload.approved_by = input.approvedBy;
  const { error } = await client.from("project_members").update(payload).eq("id", input.membershipId);
  if (error) throw error;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  project_id?: string | null;
  notification_type: string;
  title: string;
  body: string;
  read_at?: string | null;
  created_at: string;
}

export async function getUserNotifications(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from("notifications").select("id,user_id,project_id,notification_type,title,body,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return (data ?? []) as NotificationRecord[];
}

export async function markNotificationRead(notificationId: string) {
  const client = requireSupabase();
  const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
  if (error) throw error;
}

export async function createOwnerProject(input: {
  propertyId: string;
  projectCode: string;
  title: string;
  projectType: "obra_nueva" | "remodelacion" | "ampliacion" | "renovacion" | "area_anexa" | "otro";
}) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_owner_project", {
    p_property_id: input.propertyId,
    p_project_code: input.projectCode,
    p_title: input.title,
    p_project_type: input.projectType,
  });
  if (error) throw error;
  return data as ProjectRecord;
}


export async function createOwnerProjectWorkflow(input: {
  propertyId: string;
  architectEmail: string;
}) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_owner_project_workflow", {
    p_property_id: input.propertyId,
    p_architect_email: input.architectEmail,
  });
  if (error) throw error;
  const payload = data as { project: ProjectRecord };
  return payload.project;
}

export async function submitWorkflowReview(input: {
  projectId: string;
  documentVersionId: string;
  workflowStage: "autorizacion" | "anteproyecto" | "planos_tecnicos" | "legal" | "inicio_obra";
  decision: "comentado" | "devuelto" | "aprobado" | "rechazado";
  comment: string;
}) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("submit_workflow_review", {
    p_project_id: input.projectId,
    p_document_version_id: input.documentVersionId,
    p_workflow_stage: input.workflowStage,
    p_decision: input.decision,
    p_comment: input.comment,
  });
  if (error) throw error;
  return data as ProjectRecord;
}

export async function authorizeContractorForProject(input: { projectId: string; contractorEmail: string }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("authorize_contractor_for_project", {
    p_project_id: input.projectId,
    p_contractor_email: input.contractorEmail,
  });
  if (error) throw error;
  return data as ProjectMember;
}

export async function createContractorRequest(input: { projectId: string; requestType: string; requestedDate?: string; description?: string }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_contractor_request", {
    p_project_id: input.projectId,
    p_request_type: input.requestType,
    p_requested_date: input.requestedDate || null,
    p_description: input.description || null,
  });
  if (error) throw error;
  return data;
}

export async function getProjectDocuments(projectId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DocumentRecord[];
}

export async function getProjectMembers(projectId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from("project_members").select("id,user_id,membership_role,status,department_id,profiles(email,display_name)").eq("project_id", projectId).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}


export async function uploadProjectDocument(input: {
  projectId: string;
  title: string;
  category: string;
  file: File;
  visibleToOwner?: boolean;
}) {
  const client = requireSupabase();
  const profile = (await client.auth.getUser()).data.user;
  if (!profile) throw new Error("La sesión no está disponible para cargar el documento.");
  const { data: document, error: documentError } = await client.from("documents").insert({ project_id: input.projectId, category: input.category, title: input.title.trim(), cde_state: "wip", visible_to_owner: input.visibleToOwner ?? false, created_by: profile.id }).select("*").single();
  if (documentError) throw documentError;
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${input.projectId}/${document.id}/v1_${safeName}`;
  const { error: uploadError } = await client.storage.from("cde-documents").upload(storagePath, input.file, { contentType: input.file.type || "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;
  const { data: version, error: versionError } = await client.from("document_versions").insert({ document_id: document.id, version_number: 1, original_filename: input.file.name, storage_path: storagePath, mime_type: input.file.type || "application/octet-stream", file_size_bytes: input.file.size, cde_state: "wip", uploaded_by: profile.id }).select("id").single();
  if (versionError) throw versionError;
  const { error: currentVersionError } = await client.from("documents").update({ current_version_id: version.id }).eq("id", document.id);
  if (currentVersionError) throw currentVersionError;
  return { document: document as DocumentRecord, version: version as { id: string } };
}


export async function resolveContractorRequest(input: { requestId: string; status: "in_review" | "scheduled" | "approved" | "rejected" | "completed" | "cancelled"; comment?: string }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("resolve_contractor_request", {
    p_request_id: input.requestId,
    p_status: input.status,
    p_comment: input.comment || null,
  });
  if (error) throw error;
  return data;
}


export async function getProjectsForUser(userId: string) {
  const client = requireSupabase();
  const { data: memberships, error: membershipError } = await client.from("project_members").select("project_id").eq("user_id", userId).eq("status", "active");
  if (membershipError) throw membershipError;
  const projectIds = (memberships ?? []).map((row) => row.project_id as string);
  if (!projectIds.length) return [] as ProjectRecord[];
  const { data, error } = await client.from("projects").select("*").in("id", projectIds).neq("operational_status", "archivada").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectRecord[];
}

export async function getAdminProperties(): Promise<PropertyRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("properties").select("*").order("property_code", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PropertyRecord[];
}
