/**
 * Genera el SQL de Row-Level Security para todas las tablas con `workspaceId`.
 *
 * USO:
 *   node --env-file=.env prisma/scripts/generate-rls.mjs > prisma/migrations/0002_rls.sql
 *
 * Estrategia:
 *   - Funciones helper: current_user_workspace_id(), is_super_admin()
 *   - ENABLE RLS + 4 policies (SELECT/INSERT/UPDATE/DELETE) en cada tabla con workspaceId
 *   - Policies TO authenticated (Prisma conecta como rol postgres → no afectado)
 *   - Workspace: policy especial (usuario ve solo SU workspace)
 *   - User: policy especial (usuario ve usuarios de su workspace + Super Admin ve todos)
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ log: ['error'] })

const tables = await db.$queryRaw`
  SELECT c.table_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'workspaceId'
  ORDER BY c.table_name
`

// Exclude tables that have their own special policies (User, Workspace)
// to avoid duplicate policy errors.
const EXCLUDED = new Set(['User', 'Workspace'])
const tableNames = tables.map((t) => t.table_name).filter((t) => !EXCLUDED.has(t))

await db.$disconnect()

// ----- SQL header -----
const lines = [
  '-- =====================================================================',
  '-- AUTOPILOT — Row-Level Security policies',
  '-- =====================================================================',
  '-- Multi-tenant isolation: each workspace sees only its own data.',
  '-- Super Admin (User.role = SUPER_ADMIN) bypasses workspace filter.',
  '--',
  '-- Affects only the `authenticated` role (Supabase JWT users).',
  '-- The `postgres` role (used by Prisma via DATABASE_URL) is NOT affected.',
  '-- Server-side code MUST validate workspaceId on every Server Action.',
  '-- See .claude/rules/multi-tenant.md',
  '-- =====================================================================',
  '',
  '-- ---------- Helper functions ----------',
  '',
  'CREATE OR REPLACE FUNCTION public.current_user_workspace_id()',
  'RETURNS TEXT AS $$',
  '  SELECT "workspaceId" FROM public."User" WHERE id = (auth.uid())::text',
  '$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;',
  '',
  'CREATE OR REPLACE FUNCTION public.is_super_admin()',
  'RETURNS BOOLEAN AS $$',
  `  SELECT EXISTS (`,
  `    SELECT 1 FROM public."User"`,
  `    WHERE id = (auth.uid())::text AND role = 'SUPER_ADMIN'`,
  `  )`,
  '$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;',
  '',
]

// ----- Workspace table (special case: id = current workspace) -----
lines.push('-- ---------- Workspace (special: filter by own id) ----------', '')
lines.push('ALTER TABLE public."Workspace" ENABLE ROW LEVEL SECURITY;')
lines.push('')
lines.push(`CREATE POLICY "workspace_select" ON public."Workspace" FOR SELECT TO authenticated`)
lines.push(`  USING (public.is_super_admin() OR id = public.current_user_workspace_id());`)
lines.push('')
lines.push(`CREATE POLICY "workspace_insert" ON public."Workspace" FOR INSERT TO authenticated`)
lines.push(`  WITH CHECK (public.is_super_admin());`)
lines.push('')
lines.push(`CREATE POLICY "workspace_update" ON public."Workspace" FOR UPDATE TO authenticated`)
lines.push(`  USING (public.is_super_admin() OR id = public.current_user_workspace_id())`)
lines.push(`  WITH CHECK (public.is_super_admin() OR id = public.current_user_workspace_id());`)
lines.push('')
lines.push(`CREATE POLICY "workspace_delete" ON public."Workspace" FOR DELETE TO authenticated`)
lines.push(`  USING (public.is_super_admin());`)
lines.push('')

// ----- User table (special: own workspace + Super Admin sees all) -----
lines.push('-- ---------- User (special: own workspace + Super Admin) ----------', '')
lines.push('ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;')
lines.push('')
lines.push(`CREATE POLICY "user_select" ON public."User" FOR SELECT TO authenticated`)
lines.push(`  USING (`)
lines.push(`    public.is_super_admin()`)
lines.push(`    OR id = (auth.uid())::text`)
lines.push(`    OR "workspaceId" = public.current_user_workspace_id()`)
lines.push(`  );`)
lines.push('')
lines.push(`CREATE POLICY "user_insert" ON public."User" FOR INSERT TO authenticated`)
lines.push(`  WITH CHECK (`)
lines.push(`    public.is_super_admin()`)
lines.push(`    OR "workspaceId" = public.current_user_workspace_id()`)
lines.push(`  );`)
lines.push('')
lines.push(`CREATE POLICY "user_update" ON public."User" FOR UPDATE TO authenticated`)
lines.push(`  USING (`)
lines.push(`    public.is_super_admin()`)
lines.push(`    OR id = (auth.uid())::text`)
lines.push(`    OR "workspaceId" = public.current_user_workspace_id()`)
lines.push(`  );`)
lines.push('')
lines.push(`CREATE POLICY "user_delete" ON public."User" FOR DELETE TO authenticated`)
lines.push(`  USING (public.is_super_admin());`)
lines.push('')

// ----- All tables with workspaceId -----
lines.push(`-- ---------- Generic workspace-scoped tables (${tableNames.length} tables) ----------`, '')

for (const t of tableNames) {
  const policy = (op, action) =>
    `CREATE POLICY "${t.toLowerCase()}_${op.toLowerCase()}" ON public."${t}" FOR ${op} TO authenticated`

  lines.push(`-- ${t}`)
  lines.push(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY;`)
  lines.push(
    `${policy('SELECT')} USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());`
  )
  lines.push(
    `${policy('INSERT')} WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());`
  )
  lines.push(
    `${policy('UPDATE')} USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());`
  )
  lines.push(
    `${policy('DELETE')} USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());`
  )
  lines.push('')
}

console.log(lines.join('\n'))
