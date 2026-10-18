CREATE TABLE public.service_tracking_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 service_id uuid NOT NULL UNIQUE REFERENCES public.services(id) ON DELETE CASCADE,
 token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.service_tracking_links TO service_role;
ALTER TABLE public.service_tracking_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY tracking_service_role ON public.service_tracking_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.tracking_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER tracking_updated_at BEFORE UPDATE ON public.service_tracking_links FOR EACH ROW EXECUTE FUNCTION public.tracking_updated_at();
CREATE OR REPLACE FUNCTION public.create_service_tracking_link(p_service_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_token uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (
 SELECT 1 FROM public.services s WHERE s.id = p_service_id AND (
 s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.service_technicians st WHERE st.service_id=s.id AND st.technician_id=auth.uid()) OR (
 s.organization_id=public.get_user_organization_id() AND public.get_effective_user_role(s.organization_id) IN ('owner','administrador','gestor','super_admin')))) THEN
 RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 INSERT INTO public.service_tracking_links(service_id) VALUES(p_service_id) ON CONFLICT(service_id) DO UPDATE SET updated_at=now() RETURNING token INTO v_token;
 RETURN v_token;
END; $$;
REVOKE ALL ON FUNCTION public.create_service_tracking_link(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_service_tracking_link(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.submit_tracking_feedback(p_token uuid, p_rating integer, p_comment text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 OR p_comment IS NULL OR length(p_comment)>2000 THEN RAISE EXCEPTION 'Avaliação inválida'; END IF;
 UPDATE public.services s SET feedback=COALESCE(s.feedback,'{}'::jsonb) || jsonb_build_object('clientRating',p_rating,'clientComment',trim(p_comment)), updated_at=now()
 FROM public.service_tracking_links l WHERE l.token=p_token AND l.service_id=s.id AND s.status='concluido';
 IF NOT FOUND THEN RAISE EXCEPTION 'Serviço indisponível para avaliação'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.submit_tracking_feedback(uuid,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_tracking_feedback(uuid,integer,text) TO service_role;
DROP POLICY IF EXISTS "Acesso publico ao rastreio de servicos" ON public.services;