-- Create comprehensive notification triggers system

-- 1. Enhanced service status change notifications
CREATE OR REPLACE FUNCTION public.notify_service_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  status_message TEXT;
  technician_record RECORD;
  org_id UUID;
BEGIN
  -- Only trigger on status changes, not other updates
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get organization ID
    org_id := NEW.organization_id;
    
    -- Map status to readable message
    status_message := CASE NEW.status
      WHEN 'pendente' THEN 'foi marcada como pendente'
      WHEN 'em_andamento' THEN 'foi iniciada'
      WHEN 'concluido' THEN 'foi concluída'
      WHEN 'cancelado' THEN 'foi cancelada'
      WHEN 'agendado' THEN 'foi agendada'
      ELSE 'teve o status alterado'
    END;
    
    -- Notify service creator
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, message, service_id)
      VALUES (
        NEW.created_by,
        'A demanda "' || NEW.title || '" ' || status_message || '.',
        NEW.id
      );
    END IF;
    
    -- Notify all assigned technicians (except if they're the creator)
    FOR technician_record IN 
      SELECT technician_id 
      FROM public.service_technicians 
      WHERE service_id = NEW.id 
      AND technician_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      INSERT INTO public.notifications (user_id, message, service_id)
      VALUES (
        technician_record.technician_id,
        'A demanda "' || NEW.title || '" ' || status_message || '.',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Enhanced new service message notifications
CREATE OR REPLACE FUNCTION public.notify_new_service_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  service_record RECORD;
  technician_record RECORD;
BEGIN
  -- Get service details
  SELECT title, created_by, organization_id INTO service_record
  FROM public.services
  WHERE id = NEW.service_id;
  
  -- Notify service creator (if not the sender)
  IF service_record.created_by IS NOT NULL 
     AND service_record.created_by::text != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, message, service_id)
    VALUES (
      service_record.created_by,
      NEW.sender_name || ' enviou uma mensagem na demanda "' || service_record.title || '"',
      NEW.service_id
    );
  END IF;
  
  -- Notify all technicians assigned to service (except sender)
  FOR technician_record IN 
    SELECT technician_id 
    FROM public.service_technicians 
    WHERE service_id = NEW.service_id 
    AND technician_id::text != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, message, service_id)
    VALUES (
      technician_record.technician_id,
      NEW.sender_name || ' enviou uma mensagem na demanda "' || service_record.title || '"',
      NEW.service_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- 3. Enhanced technician assignment notifications
CREATE OR REPLACE FUNCTION public.handle_technician_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    service_title TEXT;
    service_creator UUID;
BEGIN
    SELECT title, created_by INTO service_title, service_creator 
    FROM public.services WHERE id = NEW.service_id;
    
    -- Notify assigned technician
    INSERT INTO public.notifications (user_id, message, service_id)
    VALUES (
        NEW.technician_id,
        '🔧 Você foi atribuído à demanda: "' || service_title || '"',
        NEW.service_id
    );
    
    -- Notify service creator (if different from technician)
    IF service_creator IS NOT NULL AND service_creator != NEW.technician_id THEN
        INSERT INTO public.notifications (user_id, message, service_id)
        VALUES (
            service_creator,
            '👤 Técnico foi atribuído à sua demanda: "' || service_title || '"',
            NEW.service_id
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 4. Enhanced material stock alerts
CREATE OR REPLACE FUNCTION public.notify_material_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  material_name TEXT;
  material_min_stock INTEGER;
  alert_message TEXT;
BEGIN
  -- Get material details
  SELECT name, min_stock INTO material_name, material_min_stock
  FROM public.materials 
  WHERE id = NEW.material_id;
  
  -- Check for low stock alert
  IF NEW.current_stock <= material_min_stock THEN
    alert_message := '⚠️ Estoque baixo: ' || material_name || ' (Atual: ' || NEW.current_stock || ' unidades)';
    
    -- Notify managers and admins
    INSERT INTO public.notifications (user_id, message)
    SELECT p.id, alert_message
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.organization_id = NEW.organization_id
    AND ur.role IN ('administrador', 'gestor', 'owner');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. Photo upload notifications
CREATE OR REPLACE FUNCTION public.notify_photo_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  service_record RECORD;
  technician_record RECORD;
BEGIN
  -- Get service details
  SELECT title, created_by, organization_id INTO service_record
  FROM public.services
  WHERE id = NEW.service_id;
  
  -- Notify service creator
  IF service_record.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, message, service_id)
    VALUES (
      service_record.created_by,
      '📷 Nova foto adicionada na demanda "' || service_record.title || '"',
      NEW.service_id
    );
  END IF;
  
  -- Notify assigned technicians (except creator)
  FOR technician_record IN 
    SELECT technician_id 
    FROM public.service_technicians 
    WHERE service_id = NEW.service_id 
    AND technician_id != COALESCE(service_record.created_by, '00000000-0000-0000-0000-000000000000'::uuid)
  LOOP
    INSERT INTO public.notifications (user_id, message, service_id)
    VALUES (
      technician_record.technician_id,
      '📷 Nova foto adicionada na demanda "' || service_record.title || '"',
      NEW.service_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create/Update triggers
DROP TRIGGER IF EXISTS on_service_status_change ON public.services;
CREATE TRIGGER on_service_status_change
  AFTER UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.notify_service_status_change();

DROP TRIGGER IF EXISTS on_new_service_message ON public.service_messages;
CREATE TRIGGER on_new_service_message
  AFTER INSERT ON public.service_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_service_message();

DROP TRIGGER IF EXISTS on_technician_assignment ON public.service_technicians;
CREATE TRIGGER on_technician_assignment
  AFTER INSERT ON public.service_technicians
  FOR EACH ROW EXECUTE FUNCTION public.handle_technician_assignment();

DROP TRIGGER IF EXISTS on_inventory_update ON public.inventory;
CREATE TRIGGER on_inventory_update
  AFTER UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.notify_material_updates();

DROP TRIGGER IF EXISTS on_photo_upload ON public.service_photos;
CREATE TRIGGER on_photo_upload
  AFTER INSERT ON public.service_photos
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_upload();

-- Enhanced RLS policies for service_messages
DROP POLICY IF EXISTS "Usuarios autenticados podem gerenciar mensagens" ON public.service_messages;

CREATE POLICY "Criadores podem ver mensagens das suas demandas"
ON public.service_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_messages.service_id 
    AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Técnicos podem ver mensagens das demandas atribuídas"
ON public.service_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_technicians st 
    WHERE st.service_id = service_messages.service_id 
    AND st.technician_id = auth.uid()
  )
);

CREATE POLICY "Gestores podem ver mensagens da organização"
ON public.service_messages FOR SELECT
USING (
  get_current_user_role() IN ('administrador', 'gestor', 'owner', 'super_admin') AND
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_messages.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Usuários autenticados podem inserir mensagens"
ON public.service_messages FOR INSERT
WITH CHECK (auth.uid()::text = sender_id);

-- Enhanced RLS policies for service_photos
DROP POLICY IF EXISTS "Authenticated users can view photos" ON public.service_photos;
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON public.service_photos;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON public.service_photos;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON public.service_photos;

CREATE POLICY "Criadores podem ver fotos das suas demandas"
ON public.service_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_photos.service_id 
    AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Técnicos podem ver fotos das demandas atribuídas"
ON public.service_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_technicians st 
    WHERE st.service_id = service_photos.service_id 
    AND st.technician_id = auth.uid()
  )
);

CREATE POLICY "Gestores podem gerenciar fotos da organização"
ON public.service_photos FOR ALL
USING (
  get_current_user_role() IN ('administrador', 'gestor', 'owner', 'super_admin') AND
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_photos.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
)
WITH CHECK (
  get_current_user_role() IN ('administrador', 'gestor', 'owner', 'super_admin') AND
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_photos.service_id 
    AND s.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Usuários autenticados podem inserir fotos"
ON public.service_photos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Técnicos podem atualizar fotos das suas demandas"
ON public.service_photos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.service_technicians st 
    WHERE st.service_id = service_photos.service_id 
    AND st.technician_id = auth.uid()
  )
);

CREATE POLICY "Técnicos podem deletar fotos das suas demandas"
ON public.service_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.service_technicians st 
    WHERE st.service_id = service_photos.service_id 
    AND st.technician_id = auth.uid()
  )
);