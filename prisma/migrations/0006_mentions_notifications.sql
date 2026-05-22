-- =====================================================================
-- 0006 — Mentions + Notifications (RLS + Realtime)
-- =====================================================================
-- - RLS for the new Mention table (multi-tenant rule: every table).
-- - Tighten Notification SELECT so a user only reads THEIR OWN notifications
--   (previously workspace-wide). Server actions use the service-role client and
--   are unaffected; the browser client (Realtime) only ever reads its own rows.
-- - Add Notification to the supabase_realtime publication so the bell receives
--   live INSERTs.
-- Helper functions public.is_super_admin() / public.current_user_workspace_id()
-- are defined in 0002_rls.sql.
-- =====================================================================

-- ---------- Mention RLS ----------
ALTER TABLE public."Mention" ENABLE ROW LEVEL SECURITY;

-- A user sees mentions in their workspace that target them or that they authored;
-- admins/super admins see all in their workspace.
CREATE POLICY "mention_select" ON public."Mention" FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      "workspaceId" = public.current_user_workspace_id()
      AND (
        "mentionedUserId" = (auth.uid())::text
        OR "authorId" = (auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM public."User" u
          WHERE u.id = (auth.uid())::text AND u.role = 'ADMIN'
        )
      )
    )
  );

CREATE POLICY "mention_insert" ON public."Mention" FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "mention_update" ON public."Mention" FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  )
  WITH CHECK (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "mention_delete" ON public."Mention" FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

-- ---------- Notification: own-rows-only SELECT ----------
DROP POLICY IF EXISTS "notification_select" ON public."Notification";
CREATE POLICY "notification_select" ON public."Notification" FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR "userId" = (auth.uid())::text
  );

-- ---------- Realtime publication ----------
-- Add Notification to the realtime publication (idempotent guard).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'Notification'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public."Notification"';
  END IF;
END $$;
