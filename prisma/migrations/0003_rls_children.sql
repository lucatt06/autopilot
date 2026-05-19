-- =====================================================================
-- AUTOPILOT — RLS for child tables (no direct workspaceId)
-- =====================================================================
-- Each policy validates access via EXISTS to the parent table.
-- The parent has workspaceId + RLS, so the chain is protected.
-- =====================================================================

-- ContactNote (via Contact)
ALTER TABLE public."ContactNote" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contactnote_select" ON public."ContactNote" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactNote"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactnote_insert" ON public."ContactNote" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactNote"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactnote_update" ON public."ContactNote" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactNote"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactNote"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactnote_delete" ON public."ContactNote" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactNote"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- ContactDocument (via Contact)
ALTER TABLE public."ContactDocument" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contactdocument_select" ON public."ContactDocument" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactDocument"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactdocument_insert" ON public."ContactDocument" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactDocument"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactdocument_update" ON public."ContactDocument" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactDocument"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactDocument"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactdocument_delete" ON public."ContactDocument" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactDocument"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- ContactEvent (via Contact)
ALTER TABLE public."ContactEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contactevent_select" ON public."ContactEvent" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactEvent"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactevent_insert" ON public."ContactEvent" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactEvent"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactevent_update" ON public."ContactEvent" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactEvent"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactEvent"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactevent_delete" ON public."ContactEvent" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactEvent"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- ContactCustomField (via Contact)
ALTER TABLE public."ContactCustomField" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contactcustomfield_select" ON public."ContactCustomField" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactCustomField"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactcustomfield_insert" ON public."ContactCustomField" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactCustomField"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactcustomfield_update" ON public."ContactCustomField" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactCustomField"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactCustomField"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contactcustomfield_delete" ON public."ContactCustomField" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactCustomField"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- ContactTag (via Contact)
ALTER TABLE public."ContactTag" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacttag_select" ON public."ContactTag" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactTag"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contacttag_insert" ON public."ContactTag" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactTag"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contacttag_update" ON public."ContactTag" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactTag"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactTag"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "contacttag_delete" ON public."ContactTag" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."ContactTag"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- UserFollowsContact (via Contact)
ALTER TABLE public."UserFollowsContact" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "userfollowscontact_select" ON public."UserFollowsContact" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."UserFollowsContact"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "userfollowscontact_insert" ON public."UserFollowsContact" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."UserFollowsContact"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "userfollowscontact_update" ON public."UserFollowsContact" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."UserFollowsContact"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."UserFollowsContact"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "userfollowscontact_delete" ON public."UserFollowsContact" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Contact" p
      WHERE p.id = public."UserFollowsContact"."contactId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- Message (via Conversation)
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_select" ON public."Message" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Conversation" p
      WHERE p.id = public."Message"."conversationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "message_insert" ON public."Message" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Conversation" p
      WHERE p.id = public."Message"."conversationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "message_update" ON public."Message" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Conversation" p
      WHERE p.id = public."Message"."conversationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Conversation" p
      WHERE p.id = public."Message"."conversationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "message_delete" ON public."Message" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Conversation" p
      WHERE p.id = public."Message"."conversationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- PipelineStage (via Pipeline)
ALTER TABLE public."PipelineStage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipelinestage_select" ON public."PipelineStage" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Pipeline" p
      WHERE p.id = public."PipelineStage"."pipelineId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "pipelinestage_insert" ON public."PipelineStage" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Pipeline" p
      WHERE p.id = public."PipelineStage"."pipelineId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "pipelinestage_update" ON public."PipelineStage" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Pipeline" p
      WHERE p.id = public."PipelineStage"."pipelineId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Pipeline" p
      WHERE p.id = public."PipelineStage"."pipelineId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "pipelinestage_delete" ON public."PipelineStage" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Pipeline" p
      WHERE p.id = public."PipelineStage"."pipelineId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- KnowledgeEntry (via KnowledgeBase)
ALTER TABLE public."KnowledgeEntry" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledgeentry_select" ON public."KnowledgeEntry" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."KnowledgeBase" p
      WHERE p.id = public."KnowledgeEntry"."knowledgeBaseId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "knowledgeentry_insert" ON public."KnowledgeEntry" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."KnowledgeBase" p
      WHERE p.id = public."KnowledgeEntry"."knowledgeBaseId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "knowledgeentry_update" ON public."KnowledgeEntry" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."KnowledgeBase" p
      WHERE p.id = public."KnowledgeEntry"."knowledgeBaseId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."KnowledgeBase" p
      WHERE p.id = public."KnowledgeEntry"."knowledgeBaseId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "knowledgeentry_delete" ON public."KnowledgeEntry" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."KnowledgeBase" p
      WHERE p.id = public."KnowledgeEntry"."knowledgeBaseId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- PunchItem (via PunchList)
ALTER TABLE public."PunchItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "punchitem_select" ON public."PunchItem" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."PunchList" p
      WHERE p.id = public."PunchItem"."punchListId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "punchitem_insert" ON public."PunchItem" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."PunchList" p
      WHERE p.id = public."PunchItem"."punchListId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "punchitem_update" ON public."PunchItem" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."PunchList" p
      WHERE p.id = public."PunchItem"."punchListId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."PunchList" p
      WHERE p.id = public."PunchItem"."punchListId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "punchitem_delete" ON public."PunchItem" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."PunchList" p
      WHERE p.id = public."PunchItem"."punchListId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- AreaReport (via AreaSupervision)
ALTER TABLE public."AreaReport" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areareport_select" ON public."AreaReport" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."AreaSupervision" p
      WHERE p.id = public."AreaReport"."areaId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "areareport_insert" ON public."AreaReport" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."AreaSupervision" p
      WHERE p.id = public."AreaReport"."areaId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "areareport_update" ON public."AreaReport" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."AreaSupervision" p
      WHERE p.id = public."AreaReport"."areaId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."AreaSupervision" p
      WHERE p.id = public."AreaReport"."areaId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "areareport_delete" ON public."AreaReport" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."AreaSupervision" p
      WHERE p.id = public."AreaReport"."areaId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- AgencyAgent (via Agency)
ALTER TABLE public."AgencyAgent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencyagent_select" ON public."AgencyAgent" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Agency" p
      WHERE p.id = public."AgencyAgent"."agencyId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "agencyagent_insert" ON public."AgencyAgent" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Agency" p
      WHERE p.id = public."AgencyAgent"."agencyId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "agencyagent_update" ON public."AgencyAgent" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Agency" p
      WHERE p.id = public."AgencyAgent"."agencyId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Agency" p
      WHERE p.id = public."AgencyAgent"."agencyId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "agencyagent_delete" ON public."AgencyAgent" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Agency" p
      WHERE p.id = public."AgencyAgent"."agencyId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- PaymentInstallment (via PaymentPlan)
ALTER TABLE public."PaymentInstallment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paymentinstallment_select" ON public."PaymentInstallment" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."PaymentPlan" p
      WHERE p.id = public."PaymentInstallment"."paymentPlanId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "paymentinstallment_insert" ON public."PaymentInstallment" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."PaymentPlan" p
      WHERE p.id = public."PaymentInstallment"."paymentPlanId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "paymentinstallment_update" ON public."PaymentInstallment" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."PaymentPlan" p
      WHERE p.id = public."PaymentInstallment"."paymentPlanId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."PaymentPlan" p
      WHERE p.id = public."PaymentInstallment"."paymentPlanId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "paymentinstallment_delete" ON public."PaymentInstallment" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."PaymentPlan" p
      WHERE p.id = public."PaymentInstallment"."paymentPlanId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- AutomationExecution (via Automation)
ALTER TABLE public."AutomationExecution" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automationexecution_select" ON public."AutomationExecution" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Automation" p
      WHERE p.id = public."AutomationExecution"."automationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "automationexecution_insert" ON public."AutomationExecution" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Automation" p
      WHERE p.id = public."AutomationExecution"."automationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "automationexecution_update" ON public."AutomationExecution" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Automation" p
      WHERE p.id = public."AutomationExecution"."automationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Automation" p
      WHERE p.id = public."AutomationExecution"."automationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "automationexecution_delete" ON public."AutomationExecution" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Automation" p
      WHERE p.id = public."AutomationExecution"."automationId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

-- CampaignAssignment (via Campaign)
ALTER TABLE public."CampaignAssignment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaignassignment_select" ON public."CampaignAssignment" FOR SELECT TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Campaign" p
      WHERE p.id = public."CampaignAssignment"."campaignId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "campaignassignment_insert" ON public."CampaignAssignment" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Campaign" p
      WHERE p.id = public."CampaignAssignment"."campaignId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "campaignassignment_update" ON public."CampaignAssignment" FOR UPDATE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Campaign" p
      WHERE p.id = public."CampaignAssignment"."campaignId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ))
  WITH CHECK (EXISTS (
      SELECT 1 FROM public."Campaign" p
      WHERE p.id = public."CampaignAssignment"."campaignId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

CREATE POLICY "campaignassignment_delete" ON public."CampaignAssignment" FOR DELETE TO authenticated
  USING (EXISTS (
      SELECT 1 FROM public."Campaign" p
      WHERE p.id = public."CampaignAssignment"."campaignId"
        AND (public.is_super_admin() OR p."workspaceId" = public.current_user_workspace_id())
    ));

