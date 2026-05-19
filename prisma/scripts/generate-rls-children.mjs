/**
 * Genera el SQL de RLS para child tables (sin workspaceId directo).
 *
 * Cada child table tiene una FK a un parent que SÍ tiene workspaceId.
 * Las policies validan acceso vía EXISTS al parent.
 *
 * USO:
 *   node --env-file=.env prisma/scripts/generate-rls-children.mjs > prisma/migrations/0003_rls_children.sql
 */

// Mapping: child table → { fk column → parent table }
// Solo necesitamos validar via UN parent (el "ancla"); el resto se valida via app o constraints.
const CHILDREN = [
  { table: 'ContactNote', fk: 'contactId', parent: 'Contact' },
  { table: 'ContactDocument', fk: 'contactId', parent: 'Contact' },
  { table: 'ContactEvent', fk: 'contactId', parent: 'Contact' },
  { table: 'ContactCustomField', fk: 'contactId', parent: 'Contact' },
  { table: 'ContactTag', fk: 'contactId', parent: 'Contact' },
  { table: 'UserFollowsContact', fk: 'contactId', parent: 'Contact' },
  { table: 'Message', fk: 'conversationId', parent: 'Conversation' },
  { table: 'PipelineStage', fk: 'pipelineId', parent: 'Pipeline' },
  { table: 'KnowledgeEntry', fk: 'knowledgeBaseId', parent: 'KnowledgeBase' },
  { table: 'PunchItem', fk: 'punchListId', parent: 'PunchList' },
  { table: 'AreaReport', fk: 'areaId', parent: 'AreaSupervision' },
  { table: 'AgencyAgent', fk: 'agencyId', parent: 'Agency' },
  { table: 'PaymentInstallment', fk: 'paymentPlanId', parent: 'PaymentPlan' },
  { table: 'AutomationExecution', fk: 'automationId', parent: 'Automation' },
  { table: 'CampaignAssignment', fk: 'campaignId', parent: 'Campaign' },
]

const lines = [
  '-- =====================================================================',
  '-- AUTOPILOT — RLS for child tables (no direct workspaceId)',
  '-- =====================================================================',
  '-- Each policy validates access via EXISTS to the parent table.',
  '-- The parent has workspaceId + RLS, so the chain is protected.',
  '-- =====================================================================',
  '',
]

for (const { table, fk, parent } of CHILDREN) {
  const check = `EXISTS (
      SELECT 1 FROM public."${parent}" p
      WHERE p.id = public."${table}"."${fk}"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    )`

  lines.push(`-- ${table} (via ${parent})`)
  lines.push(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`)
  lines.push('')
  lines.push(
    `CREATE POLICY "${table.toLowerCase()}_select" ON public."${table}" FOR SELECT TO authenticated`
  )
  lines.push(`  USING (${check});`)
  lines.push('')
  lines.push(
    `CREATE POLICY "${table.toLowerCase()}_insert" ON public."${table}" FOR INSERT TO authenticated`
  )
  lines.push(`  WITH CHECK (${check});`)
  lines.push('')
  lines.push(
    `CREATE POLICY "${table.toLowerCase()}_update" ON public."${table}" FOR UPDATE TO authenticated`
  )
  lines.push(`  USING (${check})`)
  lines.push(`  WITH CHECK (${check});`)
  lines.push('')
  lines.push(
    `CREATE POLICY "${table.toLowerCase()}_delete" ON public."${table}" FOR DELETE TO authenticated`
  )
  lines.push(`  USING (${check});`)
  lines.push('')
}

console.log(lines.join('\n'))
