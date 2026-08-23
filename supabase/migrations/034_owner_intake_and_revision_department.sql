-- Simplify owner intake and keep technical reviews under Revisión Técnica.
-- Project identity is generated while the property row is locked so concurrent
-- submissions for the same asset cannot receive the same work number.

begin;

alter table public.projects
  drop constraint if exists projects_project_type_check;

alter table public.projects
  add constraint projects_project_type_check
  check (project_type in (
    'obra_mayor',
    'obra_nueva',
    'remodelacion',
    'ampliacion',
    'renovacion',
    'area_anexa',
    'otro'
  ));

drop function if exists public.create_owner_project_workflow(uuid, text, text, text, text);

create or replace function public.create_owner_project_workflow(
  p_property_id uuid,
  p_architect_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  caller_id uuid := (select auth.uid());
  property_row public.properties;
  project_row public.projects;
  architect_id uuid;
  work_number integer;
  generated_code text;
  generated_title text;
begin
  if caller_id is null then
    raise exception 'Authentication is required';
  end if;

  select * into property_row
  from public.properties
  where id = p_property_id
    and owner_user_id = caller_id
    and status <> 'archived'
  for update;

  if property_row.id is null then
    raise exception 'The property is not owned by the authenticated user';
  end if;

  if nullif(trim(p_architect_email), '') is null then
    raise exception 'An architect email is required to start the workflow';
  end if;

  select p.id into architect_id
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  where lower(p.email) = lower(trim(p_architect_email))
    and p.status = 'active'
    and ur.role_key = 'arquitecto'
    and ur.is_active = true
  limit 1;

  if architect_id is null then
    raise exception 'The selected architect is not an active Costasur architect';
  end if;

  select count(*)::integer + 1 into work_number
  from public.projects
  where property_id = property_row.id;

  generated_code := property_row.property_code || '-OBRA-' || lpad(work_number::text, 2, '0');
  generated_title := property_row.name || ' — Obra ' || lpad(work_number::text, 2, '0');

  insert into public.projects (
    property_id,
    project_code,
    title,
    project_type,
    phase,
    cde_status,
    operational_status,
    created_by
  ) values (
    property_row.id,
    generated_code,
    generated_title,
    'obra_mayor',
    'autorizacion_inicial',
    'wip',
    'en_revision',
    caller_id
  )
  returning * into project_row;

  insert into public.project_members (
    project_id,
    user_id,
    membership_role,
    status,
    invited_by
  ) values (
    project_row.id,
    caller_id,
    'propietario',
    'active',
    caller_id
  );

  insert into public.project_members (
    project_id,
    user_id,
    membership_role,
    status,
    invited_by
  ) values (
    project_row.id,
    architect_id,
    'arquitecto',
    'pending',
    caller_id
  );

  insert into public.workflow_events (
    project_id,
    actor_id,
    actor_role,
    event_type,
    to_state,
    entity_type,
    entity_id,
    comment,
    metadata
  ) values (
    project_row.id,
    caller_id,
    'propietario',
    'project_created',
    'autorizacion_inicial',
    'project',
    project_row.id,
    'Expediente creado; carta de autorización pendiente de revisión.',
    jsonb_build_object(
      'architect_email', lower(trim(p_architect_email)),
      'work_number', work_number
    )
  );

  return jsonb_build_object(
    'project', to_jsonb(project_row),
    'architect_id', architect_id,
    'work_number', work_number
  );
end;
$$;

revoke all on function public.create_owner_project_workflow(uuid, text) from public;
revoke all on function public.create_owner_project_workflow(uuid, text) from anon;
grant execute on function public.create_owner_project_workflow(uuid, text) to authenticated;

create or replace function public.submit_workflow_review(
  p_project_id uuid,
  p_document_version_id uuid,
  p_workflow_stage text,
  p_decision text,
  p_comment text
)
returns public.projects
language plpgsql
security definer
set search_path = public, private
as $$
declare
  caller_id uuid := (select auth.uid());
  project_row public.projects;
  document_row public.documents;
  review_row public.reviews;
  reviewer_allowed boolean := false;
  new_phase text;
  new_status text;
begin
  if caller_id is null then raise exception 'Authentication is required'; end if;
  if p_decision not in ('comentado','devuelto','aprobado','rechazado') then raise exception 'Invalid workflow decision'; end if;
  if p_workflow_stage not in ('autorizacion','anteproyecto','planos_tecnicos','legal','inicio_obra') then raise exception 'Invalid workflow stage'; end if;

  select * into project_row from public.projects where id = p_project_id for update;
  if project_row.id is null then raise exception 'Project not found'; end if;

  select d.* into document_row
  from public.documents d
  join public.document_versions dv on dv.document_id = d.id
  where dv.id = p_document_version_id and d.project_id = p_project_id;
  if document_row.id is null then raise exception 'Document version does not belong to project'; end if;

  if p_workflow_stage = 'autorizacion' and document_row.category <> 'autorizacion' then raise exception 'Authorization review requires an authorization document'; end if;
  if p_workflow_stage = 'anteproyecto' and document_row.category not in ('anteproyecto','planta_conjunto','planta_nivel','elevaciones','secciones','curvas_nivel','memoria_descriptiva','anexos') then raise exception 'Anteproject review requires an anteproject package document'; end if;
  if p_workflow_stage = 'planos_tecnicos' and document_row.category not in ('arquitectonico','estructural','electrico','hidrosanitario','climatizacion','memoria_descriptiva') then raise exception 'Technical review requires a technical plan document'; end if;

  reviewer_allowed := public.is_admin();
  if not reviewer_allowed then
    select exists (
      select 1
      from public.project_members pm
      join public.user_roles ur on ur.user_id = caller_id and ur.is_active = true
      where pm.project_id = p_project_id
        and pm.user_id = caller_id
        and pm.status = 'active'
        and pm.membership_role = 'revisor'
        and (
          (p_workflow_stage in ('autorizacion','anteproyecto','planos_tecnicos') and ur.role_key = 'revision_tecnica' and ur.department_id = pm.department_id)
          or (p_workflow_stage = 'legal' and ur.role_key = 'legal' and ur.department_id = pm.department_id)
        )
    ) into reviewer_allowed;
  end if;
  if not reviewer_allowed then raise exception 'The current user is not authorized for this workflow review'; end if;

  insert into public.reviews (
    project_id,
    document_version_id,
    department_id,
    reviewer_id,
    decision,
    comment,
    workflow_stage
  )
  select
    p_project_id,
    p_document_version_id,
    d.id,
    caller_id,
    p_decision,
    nullif(trim(p_comment), ''),
    p_workflow_stage
  from public.departments d
  where d.slug = case
    when p_workflow_stage in ('autorizacion','anteproyecto','planos_tecnicos') then 'revision_tecnica'
    when p_workflow_stage = 'legal' then 'legal'
    else 'control_obras'
  end
  returning * into review_row;

  if p_decision = 'aprobado' then
    if p_workflow_stage = 'autorizacion' then
      new_phase := 'anteproyecto';
      new_status := 'en_revision';
      update public.project_members
      set status = 'active', approved_by = caller_id, updated_at = now()
      where project_id = p_project_id
        and membership_role = 'arquitecto'
        and status = 'pending';
    elsif p_workflow_stage = 'anteproyecto' then
      new_phase := 'planos_tecnicos';
      new_status := 'en_revision';
    elsif p_workflow_stage = 'planos_tecnicos' then
      new_phase := 'inicio_obra';
      new_status := 'aprobado';
    else
      new_phase := project_row.phase;
      new_status := project_row.operational_status;
    end if;
  elsif p_decision in ('devuelto','rechazado') then
    new_phase := project_row.phase;
    new_status := 'en_revision';
  else
    new_phase := project_row.phase;
    new_status := project_row.operational_status;
  end if;

  update public.projects
  set phase = new_phase,
      operational_status = new_status,
      cde_status = case when p_decision = 'aprobado' then 'shared' else cde_status end,
      updated_at = now()
  where id = p_project_id
  returning * into project_row;

  return project_row;
end;
$$;

revoke all on function public.submit_workflow_review(uuid, uuid, text, text, text) from public;
revoke all on function public.submit_workflow_review(uuid, uuid, text, text, text) from anon;
grant execute on function public.submit_workflow_review(uuid, uuid, text, text, text) to authenticated;

commit;
