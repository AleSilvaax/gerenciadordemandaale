-- Enhanced notification triggers for better user experience

-- Trigger for service status changes
CREATE OR REPLACE FUNCTION notify_service_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  status_message TEXT;
  technician_record RECORD;
BEGIN
  -- Only trigger on status changes, not other updates
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Map status to readable message
    status_message := CASE NEW.status
      WHEN 'pendente' THEN 'foi marcada como pendente'
      WHEN 'em_andamento' THEN 'foi iniciada'
      WHEN 'concluido' THEN 'foi concluída'
      WHEN 'cancelado' THEN 'foi cancelada'
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
$$;

-- Trigger for new service messages
CREATE OR REPLACE FUNCTION notify_new_service_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  service_record RECORD;
  technician_record RECORD;
BEGIN
  -- Get service details
  SELECT title, created_by INTO service_record
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
$$;

-- Trigger for material stock alerts
CREATE OR REPLACE FUNCTION notify_material_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  material_name TEXT;
  alert_message TEXT;
BEGIN
  -- Get material name
  SELECT name INTO material_name
  FROM public.materials 
  WHERE id = NEW.material_id;
  
  -- Check for low stock alert
  IF NEW.current_stock <= (
    SELECT COALESCE(min_stock, 0) 
    FROM public.materials 
    WHERE id = NEW.material_id
  ) THEN
    alert_message := 'Estoque baixo: ' || material_name || ' (Atual: ' || NEW.current_stock || ' unidades)';
    
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
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_service_status_notifications ON public.services;
CREATE TRIGGER trigger_service_status_notifications
  AFTER UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION notify_service_status_change();

DROP TRIGGER IF EXISTS trigger_service_message_notifications ON public.service_messages;
CREATE TRIGGER trigger_service_message_notifications
  AFTER INSERT ON public.service_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_service_message();

DROP TRIGGER IF EXISTS trigger_material_stock_notifications ON public.inventory;
CREATE TRIGGER trigger_material_stock_notifications
  AFTER UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION notify_material_updates();