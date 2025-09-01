
-- 1) Função de validação antes de concluir a demanda
-- Retorna somente os materiais com falta (missing > 0)
CREATE OR REPLACE FUNCTION public.validate_service_completion(p_service_id uuid)
RETURNS TABLE (
  material_id uuid,
  material_name text,
  used_quantity integer,
  current_stock integer,
  missing integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    smu.material_id,
    m.name AS material_name,
    smu.used_quantity,
    COALESCE(inv.current_stock, 0) AS current_stock,
    GREATEST(smu.used_quantity - COALESCE(inv.current_stock, 0), 0) AS missing
  FROM public.service_material_usage smu
  LEFT JOIN public.materials m
    ON m.id = smu.material_id
  LEFT JOIN public.inventory inv
    ON inv.material_id = smu.material_id
   AND inv.organization_id = public.get_current_user_organization_id()
  WHERE smu.service_id = p_service_id
    AND smu.used_quantity > 0
    AND NOT smu.is_completed
    AND (smu.used_quantity - COALESCE(inv.current_stock, 0)) > 0;
$function$;

-- 2) Tornar create_inventory_movement resiliente quando não há linha em inventory
-- (define estoque atual como 0 quando SELECT não retorna linha)
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
  v_current_stock INTEGER := 0;  -- default 0 caso não exista registro
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Organização do usuário
  v_org_id := public.get_current_user_organization_id();

  -- Estoque atual (se não encontrar linha, mantém 0)
  SELECT inv.current_stock
    INTO v_current_stock
  FROM public.inventory inv
  WHERE inv.material_id = p_material_id
    AND inv.organization_id = v_org_id;

  IF NOT FOUND THEN
    v_current_stock := 0;
  END IF;

  -- Calcular novo estoque
  CASE p_movement_type
    WHEN 'entrada' THEN
      v_new_stock := COALESCE(v_current_stock, 0) + p_quantity;
    WHEN 'saida' THEN
      v_new_stock := COALESCE(v_current_stock, 0) - p_quantity;
    WHEN 'ajuste' THEN
      v_new_stock := p_quantity;
    ELSE
      v_new_stock := COALESCE(v_current_stock, 0);
  END CASE;

  -- Validar que o estoque não fica negativo
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente. Estoque atual: %, Tentativa de saída: %', COALESCE(v_current_stock, 0), p_quantity
      USING ERRCODE = 'P0001';
  END IF;

  -- Registrar movimentação
  INSERT INTO public.inventory_movements (
    material_id, movement_type, quantity, previous_stock, new_stock,
    reference_id, reference_type, notes, cost_per_unit, organization_id
  )
  VALUES (
    p_material_id, p_movement_type, p_quantity, COALESCE(v_current_stock, 0), v_new_stock,
    p_reference_id, p_reference_type, p_notes, p_cost_per_unit, v_org_id
  )
  RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$function$;
