-- =====================================================================
-- 0007 — PaymentPlanVersion (RLS)
-- =====================================================================
-- Immutable historical snapshots of a payment plan. Workspace-scoped like
-- every other tenant table. Server actions use the service-role client and are
-- unaffected; this protects any direct browser/anon access.
-- Helper functions public.is_super_admin() / public.current_user_workspace_id()
-- are defined in 0002_rls.sql.
-- =====================================================================

ALTER TABLE public."PaymentPlanVersion" ENABLE ROW LEVEL SECURITY;

-- Read: same workspace (or super admin).
CREATE POLICY "ppv_select" ON public."PaymentPlanVersion" FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

-- Insert: same workspace.
CREATE POLICY "ppv_insert" ON public."PaymentPlanVersion" FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

-- Versions are immutable: no UPDATE policy. Allow DELETE only within workspace
-- (used implicitly by ON DELETE CASCADE when a plan is removed).
CREATE POLICY "ppv_delete" ON public."PaymentPlanVersion" FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );
