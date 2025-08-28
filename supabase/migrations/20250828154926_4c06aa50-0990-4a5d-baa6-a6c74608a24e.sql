
-- 1) Recriar políticas em public.service_photos para corrigir permissões e impedir mudanças após conclusão

-- Dropar políticas existentes (nomes conforme listagem atual)
DROP POLICY IF EXISTS "Criadores podem inserir fotos em suas demandas" ON public.service_photos;
DROP POLICY IF EXISTS "Criadores podem ver fotos das suas demandas" ON public.service_photos;
DROP POLICY IF EXISTS "Gestores podem gerenciar fotos da organização" ON public.service_photos;
DROP POLICY IF EXISTS "Técnicos podem atualizar fotos das suas demandas" ON public.service_photos;
DROP POLICY IF EXISTS "Técnicos podem deletar fotos das suas demandas" ON public.service_photos;
DROP POLICY IF EXISTS "Técnicos podem inserir fotos em demandas atribuídas" ON public.service_photos;
DROP POLICY IF EXISTS "Técnicos podem ver fotos das demandas atribuídas" ON public.service_photos;

-- Garantir que RLS está habilitado
ALTER TABLE public.service_photos ENABLE ROW LEVEL SECURITY;

-- SELECT: criador, técnicos atribuídos e gestores/admin/owner/super_admin da organização
CREATE POLICY service_photos_select_unified
  ON public.service_photos
  FOR SELECT
  USING (
    -- Criador da demanda
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_photos.service_id
        AND s.created_by = auth.uid()
    )
    OR
    -- Técnico atribuído
    EXISTS (
      SELECT 1 FROM public.service_technicians st
      WHERE st.service_id = service_photos.service_id
        AND st.technician_id = auth.uid()
    )
    OR
    -- Gestores/Admin/Owner/Super Admin da organização
    (
      get_current_user_role() IN ('administrador','gestor','owner','super_admin')
      AND EXISTS (
        SELECT 1 FROM public.services s2
        WHERE s2.id = service_photos.service_id
          AND s2.organization_id = get_current_user_organization_id()
      )
    )
  );

-- INSERT: permitido apenas se serviço não estiver concluído
CREATE POLICY service_photos_insert_unified
  ON public.service_photos
  FOR INSERT
  WITH CHECK (
    -- Criador da demanda, serviço não concluído
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_photos.service_id
        AND s.created_by = auth.uid()
        AND s.status <> 'concluido'
    )
    OR
    -- Técnico atribuído, serviço não concluído
    EXISTS (
      SELECT 1
      FROM public.service_technicians st
      JOIN public.services s ON s.id = st.service_id
      WHERE st.service_id = service_photos.service_id
        AND st.technician_id = auth.uid()
        AND s.status <> 'concluido'
    )
    OR
    -- Gestores/Admin/Owner/Super Admin da organização, serviço não concluído
    (
      get_current_user_role() IN ('administrador','gestor','owner','super_admin')
      AND EXISTS (
        SELECT 1 FROM public.services s2
        WHERE s2.id = service_photos.service_id
          AND s2.organization_id = get_current_user_organization_id()
          AND s2.status <> 'concluido'
      )
    )
  );

-- UPDATE: permitido apenas se serviço não estiver concluído
CREATE POLICY service_photos_update_unified
  ON public.service_photos
  FOR UPDATE
  USING (
    -- Criador da demanda, serviço não concluído
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_photos.service_id
        AND s.created_by = auth.uid()
        AND s.status <> 'concluido'
    )
    OR
    -- Técnico atribuído, serviço não concluído
    EXISTS (
      SELECT 1
      FROM public.service_technicians st
      JOIN public.services s ON s.id = st.service_id
      WHERE st.service_id = service_photos.service_id
        AND st.technician_id = auth.uid()
        AND s.status <> 'concluido'
    )
    OR
    -- Gestores/Admin/Owner/Super Admin da organização, serviço não concluído
    (
      get_current_user_role() IN ('administrador','gestor','owner','super_admin')
      AND EXISTS (
        SELECT 1 FROM public.services s2
        WHERE s2.id = service_photos.service_id
          AND s2.organization_id = get_current_user_organization_id()
          AND s2.status <> 'concluido'
      )
    )
  )
  WITH CHECK (
    -- Garante que o "novo" registro ainda pertence a um serviço não concluído (service_id não muda, mas reforçamos)
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_photos.service_id
        AND s.status <> 'concluido'
    )
  );

-- DELETE: permitido apenas se serviço não estiver concluído
CREATE POLICY service_photos_delete_unified
  ON public.service_photos
  FOR DELETE
  USING (
    -- Criador da demanda, serviço não concluído
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_photos.service_id
        AND s.created_by = auth.uid()
        AND s.status <> 'concluido'
    )
    OR
    -- Técnico atribuído, serviço não concluído
    EXISTS (
      SELECT 1
      FROM public.service_technicians st
      JOIN public.services s ON s.id = st.service_id
      WHERE st.service_id = service_photos.service_id
        AND st.technician_id = auth.uid()
        AND s.status <> 'concluido'
    )
    OR
    -- Gestores/Admin/Owner/Super Admin da organização, serviço não concluído
    (
      get_current_user_role() IN ('administrador','gestor','owner','super_admin')
      AND EXISTS (
        SELECT 1 FROM public.services s2
        WHERE s2.id = service_photos.service_id
          AND s2.organization_id = get_current_user_organization_id()
          AND s2.status <> 'concluido'
      )
    )
  );

-- 2) Bloquear alterações em assinaturas e fotos quando o serviço já estiver concluído

CREATE OR REPLACE FUNCTION public.prevent_edits_to_media_after_conclusion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Se o serviço já estava concluído, não permitir mudanças em assinaturas e fotos
  IF OLD.status = 'concluido' THEN
    IF NEW.signatures IS DISTINCT FROM OLD.signatures
       OR NEW.photos IS DISTINCT FROM OLD.photos
       OR NEW.photo_titles IS DISTINCT FROM OLD.photo_titles THEN
      RAISE EXCEPTION 'Serviço concluído: não é permitido alterar fotos, títulos de fotos ou assinaturas.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_edits_after_conclusion ON public.services;

CREATE TRIGGER trg_prevent_edits_after_conclusion
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.prevent_edits_to_media_after_conclusion();
