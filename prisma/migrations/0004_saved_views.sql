Error: P1017

Server has closed the connection.

=======================
-- 0004 — SavedView model (Smart Lists)
-- =====================================================================
-- Saved filter combinations the user pins as tabs (Doc 1 §7.5).
-- Currently used for Contacts; entityType allows future extension.
-- =====================================================================

CREATE TABLE "SavedView" (
  "id"          TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "entityType"  TEXT NOT NULL,
  "filters"     JSONB NOT NULL,
  "isShared"    BOOLEAN NOT NULL DEFAULT false,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedView_workspaceId_userId_entityType_idx"
  ON "SavedView"("workspaceId", "userId", "entityType");

ALTER TABLE "SavedView"
  ADD CONSTRAINT "SavedView_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SavedView"
  ADD CONSTRAINT "SavedView_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- RLS policies ----------
-- A user sees their own views + shared views in their workspace.
-- Writes only to own views. Super Admin bypasses.

ALTER TABLE public."SavedView" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savedview_select" ON public."SavedView" FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      "workspaceId" = public.current_user_workspace_id()
      AND ("userId" = (auth.uid())::text OR "isShared" = true)
    )
  );

CREATE POLICY "savedview_insert" ON public."SavedView" FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR ("workspaceId" = public.current_user_workspace_id() AND "userId" = (auth.uid())::text)
  );

CREATE POLICY "savedview_update" ON public."SavedView" FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR ("workspaceId" = public.current_user_workspace_id() AND "userId" = (auth.uid())::text)
  )
  WITH CHECK (
    public.is_super_admin()
    OR ("workspaceId" = public.current_user_workspace_id() AND "userId" = (auth.uid())::text)
  );

CREATE POLICY "savedview_delete" ON public."SavedView" FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR ("workspaceId" = public.current_user_workspace_id() AND "userId" = (auth.uid())::text)
  );
