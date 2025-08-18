-- Fix the create_inventory_movement function to use qualified function calls
CREATE OR REPLACE FUNCTION public.create_inventory_movement(
  p_material_id uuid, 
  p_movement_type text, 
  p_quantity integer, 
  p_reference_id uuid DEFAULT NULL::uuid, 
  p_reference_type text DEFAULT NULL::text, 
  p_notes text DEFAULT NULL::text, 
  p_cost_per_unit numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_org_id UUID;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Obter organização do usuário
  v_org_id := public.get_current_user_organization_id();
  
  -- Obter estoque atual
  SELECT COALESCE(current_stock, 0) INTO v_current_stock
  FROM public.inventory 
  WHERE material_id = p_material_id AND organization_id = v_org_id;
  
  -- Calcular novo estoque baseado no tipo de movimentação
  CASE p_movement_type
    WHEN 'entrada' THEN
      v_new_stock := COALESCE(v_current_stock, 0) + p_quantity;
    WHEN 'saida' THEN
      v_new_stock := COALESCE(v_current_stock, 0) - p_quantity;
    WHEN 'ajuste' THEN
      v_new_stock := p_quantity; -- Quantidade já é o valor final
    ELSE
      v_new_stock := COALESCE(v_current_stock, 0);
  END CASE;
  
  -- Validar que o estoque não fica negativo
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente. Estoque atual: %, Tentativa de saída: %', v_current_stock, p_quantity;
  END IF;
  
  -- Criar movimentação
  INSERT INTO public.inventory_movements (
    material_id, movement_type, quantity, previous_stock, new_stock,
    reference_id, reference_type, notes, cost_per_unit, organization_id
  ) VALUES (
    p_material_id, p_movement_type, p_quantity, COALESCE(v_current_stock, 0), v_new_stock,
    p_reference_id, p_reference_type, p_notes, p_cost_per_unit, v_org_id
  ) RETURNING id INTO v_movement_id;
  
  RETURN v_movement_id;
END;
$function$;

-- Enable realtime for notifications
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.service_messages REPLICA IDENTITY FULL;
ALTER TABLE public.service_photos REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_movements REPLICA IDENTITY FULL;
ALTER TABLE public.materials REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;