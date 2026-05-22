-- =====================================================================
-- 0008 — FunnelStageOverride (RLS)
-- =====================================================================
-- Manual stage placements for units inside a funnel (e.g. "posventa").
-- Workspace-scoped like every tenant table. Server actions use the
-- service-role client; these policies protect direct browser/anon access.
-- Helper functions public.is_super_admin() / public.current_user_workspace_id()
-- are defined in 0002_rls.sql.
-- =====================================================================

ALTER TABLE public."FunnelStageOverride" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fso_select" ON public."FunnelStageOverride" FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "fso_insert" ON public."FunnelStageOverride" FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "fso_update" ON public."FunnelStageOverride" FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  )
  WITH CHECK (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "fso_delete" ON public."FunnelStageOverride" FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );
