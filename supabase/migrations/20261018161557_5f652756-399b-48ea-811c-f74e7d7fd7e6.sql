REVOKE ALL ON public.service_tracking_links FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.service_tracking_links TO authenticated;
CREATE POLICY tracking_authorized_team ON public.service_tracking_links FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.services s WHERE s.id=service_id)) WITH CHECK (EXISTS(SELECT 1 FROM public.services s WHERE s.id=service_id));
ALTER FUNCTION public.create_service_tracking_link(uuid) SECURITY INVOKER;
COMMENT ON TABLE public.service_tracking_links IS '@graphql({"omit": true})';