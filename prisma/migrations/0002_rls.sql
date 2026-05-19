-- =====================================================================
-- AUTOPILOT — Row-Level Security policies
-- =====================================================================
-- Multi-tenant isolation: each workspace sees only its own data.
-- Super Admin (User.role = SUPER_ADMIN) bypasses workspace filter.
--
-- Affects only the `authenticated` role (Supabase JWT users).
-- The `postgres` role (used by Prisma via DATABASE_URL) is NOT affected.
-- Server-side code MUST validate workspaceId on every Server Action.
-- See .claude/rules/multi-tenant.md
-- =====================================================================

-- ---------- Helper functions ----------

CREATE OR REPLACE FUNCTION public.current_user_workspace_id()
RETURNS TEXT AS $$
  SELECT "workspaceId" FROM public."User" WHERE id = (auth.uid())::text
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = (auth.uid())::text AND role = 'SUPER_ADMIN'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- ---------- Workspace (special: filter by own id) ----------

ALTER TABLE public."Workspace" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON public."Workspace" FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = public.current_user_workspace_id());

CREATE POLICY "workspace_insert" ON public."Workspace" FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "workspace_update" ON public."Workspace" FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR id = public.current_user_workspace_id())
  WITH CHECK (public.is_super_admin() OR id = public.current_user_workspace_id());

CREATE POLICY "workspace_delete" ON public."Workspace" FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ---------- User (special: own workspace + Super Admin) ----------

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select" ON public."User" FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR id = (auth.uid())::text
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "user_insert" ON public."User" FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "user_update" ON public."User" FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR id = (auth.uid())::text
    OR "workspaceId" = public.current_user_workspace_id()
  );

CREATE POLICY "user_delete" ON public."User" FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ---------- Generic workspace-scoped tables (50 tables) ----------

-- Agency
ALTER TABLE public."Agency" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency_select" ON public."Agency" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "agency_insert" ON public."Agency" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "agency_update" ON public."Agency" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "agency_delete" ON public."Agency" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- AgentRouting
ALTER TABLE public."AgentRouting" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agentrouting_select" ON public."AgentRouting" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "agentrouting_insert" ON public."AgentRouting" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "agentrouting_update" ON public."AgentRouting" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "agentrouting_delete" ON public."AgentRouting" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- AiAgent
ALTER TABLE public."AiAgent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aiagent_select" ON public."AiAgent" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "aiagent_insert" ON public."AiAgent" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "aiagent_update" ON public."AiAgent" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "aiagent_delete" ON public."AiAgent" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- AiCall
ALTER TABLE public."AiCall" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aicall_select" ON public."AiCall" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "aicall_insert" ON public."AiCall" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "aicall_update" ON public."AiCall" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "aicall_delete" ON public."AiCall" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Appointment
ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointment_select" ON public."Appointment" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "appointment_insert" ON public."Appointment" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "appointment_update" ON public."Appointment" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "appointment_delete" ON public."Appointment" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- AreaSupervision
ALTER TABLE public."AreaSupervision" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areasupervision_select" ON public."AreaSupervision" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "areasupervision_insert" ON public."AreaSupervision" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "areasupervision_update" ON public."AreaSupervision" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "areasupervision_delete" ON public."AreaSupervision" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- AuditLog
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditlog_select" ON public."AuditLog" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "auditlog_insert" ON public."AuditLog" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "auditlog_update" ON public."AuditLog" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "auditlog_delete" ON public."AuditLog" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Automation
ALTER TABLE public."Automation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_select" ON public."Automation" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "automation_insert" ON public."Automation" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "automation_update" ON public."Automation" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "automation_delete" ON public."Automation" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Block
ALTER TABLE public."Block" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_select" ON public."Block" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "block_insert" ON public."Block" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "block_update" ON public."Block" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "block_delete" ON public."Block" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- BudgetItem
ALTER TABLE public."BudgetItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgetitem_select" ON public."BudgetItem" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "budgetitem_insert" ON public."BudgetItem" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "budgetitem_update" ON public."BudgetItem" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "budgetitem_delete" ON public."BudgetItem" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Building
ALTER TABLE public."Building" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "building_select" ON public."Building" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "building_insert" ON public."Building" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "building_update" ON public."Building" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "building_delete" ON public."Building" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Calendar
ALTER TABLE public."Calendar" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_select" ON public."Calendar" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "calendar_insert" ON public."Calendar" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "calendar_update" ON public."Calendar" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "calendar_delete" ON public."Calendar" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Campaign
ALTER TABLE public."Campaign" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_select" ON public."Campaign" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "campaign_insert" ON public."Campaign" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "campaign_update" ON public."Campaign" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "campaign_delete" ON public."Campaign" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Commission
ALTER TABLE public."Commission" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_select" ON public."Commission" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "commission_insert" ON public."Commission" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "commission_update" ON public."Commission" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "commission_delete" ON public."Commission" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- CommissionConfig
ALTER TABLE public."CommissionConfig" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissionconfig_select" ON public."CommissionConfig" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "commissionconfig_insert" ON public."CommissionConfig" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "commissionconfig_update" ON public."CommissionConfig" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "commissionconfig_delete" ON public."CommissionConfig" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Contact
ALTER TABLE public."Contact" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_select" ON public."Contact" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contact_insert" ON public."Contact" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contact_update" ON public."Contact" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contact_delete" ON public."Contact" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Contract
ALTER TABLE public."Contract" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contract_select" ON public."Contract" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contract_insert" ON public."Contract" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contract_update" ON public."Contract" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contract_delete" ON public."Contract" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- ContractTemplate
ALTER TABLE public."ContractTemplate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracttemplate_select" ON public."ContractTemplate" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contracttemplate_insert" ON public."ContractTemplate" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contracttemplate_update" ON public."ContractTemplate" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "contracttemplate_delete" ON public."ContractTemplate" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Conversation
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_select" ON public."Conversation" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "conversation_insert" ON public."Conversation" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "conversation_update" ON public."Conversation" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "conversation_delete" ON public."Conversation" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- CustomFieldDefinition
ALTER TABLE public."CustomFieldDefinition" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customfielddefinition_select" ON public."CustomFieldDefinition" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "customfielddefinition_insert" ON public."CustomFieldDefinition" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "customfielddefinition_update" ON public."CustomFieldDefinition" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "customfielddefinition_delete" ON public."CustomFieldDefinition" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Customer
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_select" ON public."Customer" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "customer_insert" ON public."Customer" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "customer_update" ON public."Customer" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "customer_delete" ON public."Customer" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Deal
ALTER TABLE public."Deal" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_select" ON public."Deal" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deal_insert" ON public."Deal" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deal_update" ON public."Deal" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deal_delete" ON public."Deal" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- DeliveryAct
ALTER TABLE public."DeliveryAct" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveryact_select" ON public."DeliveryAct" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deliveryact_insert" ON public."DeliveryAct" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deliveryact_update" ON public."DeliveryAct" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deliveryact_delete" ON public."DeliveryAct" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- DeliveryActTemplate
ALTER TABLE public."DeliveryActTemplate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveryacttemplate_select" ON public."DeliveryActTemplate" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deliveryacttemplate_insert" ON public."DeliveryActTemplate" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deliveryacttemplate_update" ON public."DeliveryActTemplate" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "deliveryacttemplate_delete" ON public."DeliveryActTemplate" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Inspection
ALTER TABLE public."Inspection" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspection_select" ON public."Inspection" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "inspection_insert" ON public."Inspection" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "inspection_update" ON public."Inspection" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "inspection_delete" ON public."Inspection" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- InspectionTemplate
ALTER TABLE public."InspectionTemplate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspectiontemplate_select" ON public."InspectionTemplate" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "inspectiontemplate_insert" ON public."InspectionTemplate" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "inspectiontemplate_update" ON public."InspectionTemplate" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "inspectiontemplate_delete" ON public."InspectionTemplate" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- IntegrationCredential
ALTER TABLE public."IntegrationCredential" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrationcredential_select" ON public."IntegrationCredential" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "integrationcredential_insert" ON public."IntegrationCredential" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "integrationcredential_update" ON public."IntegrationCredential" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "integrationcredential_delete" ON public."IntegrationCredential" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- KnowledgeBase
ALTER TABLE public."KnowledgeBase" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledgebase_select" ON public."KnowledgeBase" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "knowledgebase_insert" ON public."KnowledgeBase" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "knowledgebase_update" ON public."KnowledgeBase" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "knowledgebase_delete" ON public."KnowledgeBase" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Notification
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_select" ON public."Notification" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "notification_insert" ON public."Notification" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "notification_update" ON public."Notification" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "notification_delete" ON public."Notification" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Payment
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_select" ON public."Payment" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "payment_insert" ON public."Payment" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "payment_update" ON public."Payment" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "payment_delete" ON public."Payment" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- PaymentPlan
ALTER TABLE public."PaymentPlan" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paymentplan_select" ON public."PaymentPlan" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "paymentplan_insert" ON public."PaymentPlan" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "paymentplan_update" ON public."PaymentPlan" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "paymentplan_delete" ON public."PaymentPlan" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- PaymentPlanTemplate
ALTER TABLE public."PaymentPlanTemplate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paymentplantemplate_select" ON public."PaymentPlanTemplate" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "paymentplantemplate_insert" ON public."PaymentPlanTemplate" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "paymentplantemplate_update" ON public."PaymentPlanTemplate" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "paymentplantemplate_delete" ON public."PaymentPlanTemplate" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Pipeline
ALTER TABLE public."Pipeline" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_select" ON public."Pipeline" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "pipeline_insert" ON public."Pipeline" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "pipeline_update" ON public."Pipeline" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "pipeline_delete" ON public."Pipeline" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- ProgressEntry
ALTER TABLE public."ProgressEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progressentry_select" ON public."ProgressEntry" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "progressentry_insert" ON public."ProgressEntry" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "progressentry_update" ON public."ProgressEntry" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "progressentry_delete" ON public."ProgressEntry" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Project
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_select" ON public."Project" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "project_insert" ON public."Project" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "project_update" ON public."Project" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "project_delete" ON public."Project" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- PunchList
ALTER TABLE public."PunchList" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "punchlist_select" ON public."PunchList" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "punchlist_insert" ON public."PunchList" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "punchlist_update" ON public."PunchList" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "punchlist_delete" ON public."PunchList" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Reservation
ALTER TABLE public."Reservation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservation_select" ON public."Reservation" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "reservation_insert" ON public."Reservation" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "reservation_update" ON public."Reservation" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "reservation_delete" ON public."Reservation" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Sale
ALTER TABLE public."Sale" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_select" ON public."Sale" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "sale_insert" ON public."Sale" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "sale_update" ON public."Sale" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "sale_delete" ON public."Sale" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- ScheduleItem
ALTER TABLE public."ScheduleItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduleitem_select" ON public."ScheduleItem" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "scheduleitem_insert" ON public."ScheduleItem" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "scheduleitem_update" ON public."ScheduleItem" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "scheduleitem_delete" ON public."ScheduleItem" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- StaffMember
ALTER TABLE public."StaffMember" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staffmember_select" ON public."StaffMember" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "staffmember_insert" ON public."StaffMember" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "staffmember_update" ON public."StaffMember" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "staffmember_delete" ON public."StaffMember" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Subcontractor
ALTER TABLE public."Subcontractor" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcontractor_select" ON public."Subcontractor" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "subcontractor_insert" ON public."Subcontractor" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "subcontractor_update" ON public."Subcontractor" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "subcontractor_delete" ON public."Subcontractor" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Supplier
ALTER TABLE public."Supplier" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_select" ON public."Supplier" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "supplier_insert" ON public."Supplier" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "supplier_update" ON public."Supplier" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "supplier_delete" ON public."Supplier" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- SupplierPayment
ALTER TABLE public."SupplierPayment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplierpayment_select" ON public."SupplierPayment" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "supplierpayment_insert" ON public."SupplierPayment" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "supplierpayment_update" ON public."SupplierPayment" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "supplierpayment_delete" ON public."SupplierPayment" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Tag
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tag_select" ON public."Tag" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "tag_insert" ON public."Tag" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "tag_update" ON public."Tag" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "tag_delete" ON public."Tag" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Task
ALTER TABLE public."Task" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_select" ON public."Task" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "task_insert" ON public."Task" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "task_update" ON public."Task" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "task_delete" ON public."Task" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Unit
ALTER TABLE public."Unit" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unit_select" ON public."Unit" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "unit_insert" ON public."Unit" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "unit_update" ON public."Unit" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "unit_delete" ON public."Unit" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- User
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_select" ON public."User" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "user_insert" ON public."User" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "user_update" ON public."User" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "user_delete" ON public."User" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- Warranty
ALTER TABLE public."Warranty" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warranty_select" ON public."Warranty" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "warranty_insert" ON public."Warranty" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "warranty_update" ON public."Warranty" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "warranty_delete" ON public."Warranty" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- WhatsappCrmAction
ALTER TABLE public."WhatsappCrmAction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsappcrmaction_select" ON public."WhatsappCrmAction" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "whatsappcrmaction_insert" ON public."WhatsappCrmAction" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "whatsappcrmaction_update" ON public."WhatsappCrmAction" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "whatsappcrmaction_delete" ON public."WhatsappCrmAction" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

-- WorkOrder
ALTER TABLE public."WorkOrder" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workorder_select" ON public."WorkOrder" FOR SELECT TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "workorder_insert" ON public."WorkOrder" FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "workorder_update" ON public."WorkOrder" FOR UPDATE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id()) WITH CHECK (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());
CREATE POLICY "workorder_delete" ON public."WorkOrder" FOR DELETE TO authenticated USING (public.is_super_admin() OR "workspaceId" = public.current_user_workspace_id());

