
-- 1) Backfill: cria registros de estoque para materiais sem inventory (estoque inicial = 0)
INSERT INTO public.inventory (material_id, current_stock, reserved_stock, available_stock, organization_id)
SELECT m.id, 0, 0, 0, m.organization_id
FROM public.materials m
LEFT JOIN public.inventory i
  ON i.material_id = m.id
 AND i.organization_id = m.organization_id
WHERE i.id IS NULL;

-- 2) Tornar a mensagem de "estoque insuficiente" mais informativa na função de movimentação
CREATE OR REPLACE FUNCTION public.create_inventory_movement(
  p_material_id uuid, 
  p_movement_type text, 
  p_quantity integer,
  p_reference_id uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_cost_per_unit numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_current_stock integer;
  v_new_stock integer;
  v_movement_id uuid;
  v_material_name text;
BEGIN
  v_org_id := get_current_user_organization_id();

  -- Nome do material (somente para mensagem de erro mais clara)
  SELECT name INTO v_material_name
  FROM public.materials
  WHERE id = p_material_id;

  -- Estoque atual (0 se não existir registro)
  SELECT COALESCE(current_stock, 0) INTO v_current_stock
  FROM public.inventory 
  WHERE material_id = p_material_id AND organization_id = v_org_id;

  -- Calcula novo estoque
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

  -- Validação: não permitir negativo
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente para "%". Estoque atual: %, Saída solicitada: %',
      COALESCE(v_material_name, p_material_id::text),
      COALESCE(v_current_stock, 0),
      p_quantity;
  END IF;

  -- Insere movimentação
  INSERT INTO public.inventory_movements (
    material_id, movement_type, quantity, previous_stock, new_stock,
    reference_id, reference_type, notes, cost_per_unit, organization_id
  ) VALUES (
    p_material_id, p_movement_type, p_quantity, COALESCE(v_current_stock, 0), v_new_stock,
    p_reference_id, p_reference_type, p_notes, p_cost_per_unit, v_org_id
  )
  RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$$;

-- 3) Validação agregada antes de concluir (para uso no frontend)
-- Retorna lista de materiais com falta (missing > 0)
CREATE OR REPLACE FUNCTION public.validate_service_completion(p_service_id uuid)
RETURNS TABLE (
  material_id uuid,
  material_name text,
  used_quantity integer,
  current_stock integer,
  missing integer
) AS $$
BEGIN
  -- Garantir autorização do usuário sobre a demanda
  IF NOT EXISTS (
    SELECT 1
    FROM public.services s
    WHERE s.id = p_service_id
      AND (
        s.created_by = auth.uid()
        OR (
          get_current_user_role() IN ('gestor','administrador','owner','super_admin')
          AND s.organization_id = get_current_user_organization_id()
        )
        OR EXISTS (
          SELECT 1 FROM public.service_technicians st
          WHERE st.service_id = s.id AND st.technician_id = auth.uid()
        )
      )
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT 
    smu.material_id,
    m.name AS material_name,
    COALESCE(smu.used_quantity, 0) AS used_quantity,
    COALESCE(i.current_stock, 0) AS current_stock,
    GREATEST(COALESCE(smu.used_quantity, 0) - COALESCE(i.current_stock, 0), 0) AS missing
  FROM public.service_material_usage smu
  JOIN public.materials m ON m.id = smu.material_id
  LEFT JOIN public.inventory i 
    ON i.material_id = smu.material_id 
   AND i.organization_id = m.organization_id
  WHERE smu.service_id = p_service_id
    AND COALESCE(smu.used_quantity, 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- 4) Opcional: tornar a falha mais amigável ao validar tudo de uma vez no trigger
-- (Mantemos o comportamento de bloquear a conclusão se faltar estoque,
--  mas agora a mensagem lista todos os itens em falta)
CREATE OR REPLACE FUNCTION public.process_service_materials_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deficit_count integer;
  deficit_list text;
BEGIN
  IF OLD.status IS DISTINCT FROM 'concluido' AND NEW.status = 'concluido' THEN
    -- Verifica se há qualquer material com falta
    SELECT COUNT(*) INTO deficit_count
    FROM (
      SELECT 1
      FROM public.service_material_usage smu
      JOIN public.materials m ON m.id = smu.material_id
      LEFT JOIN public.inventory i 
        ON i.material_id = smu.material_id 
       AND i.organization_id = m.organization_id
      WHERE smu.service_id = NEW.id
        AND COALESCE(smu.used_quantity, 0) > COALESCE(i.current_stock, 0)
    ) q;

    IF deficit_count > 0 THEN
      -- Monta lista resumida dos itens com falta
      SELECT string_agg(
        format('%s (usado %s, estoque %s)', m.name, COALESCE(smu.used_quantity,0), COALESCE(i.current_stock,0)),
        ', '
      )
      INTO deficit_list
      FROM public.service_material_usage smu
      JOIN public.materials m ON m.id = smu.material_id
      LEFT JOIN public.inventory i 
        ON i.material_id = smu.material_id 
       AND i.organization_id = m.organization_id
      WHERE smu.service_id = NEW.id
        AND COALESCE(smu.used_quantity, 0) > COALESCE(i.current_stock, 0);

      RAISE EXCEPTION 'Não foi possível concluir: estoque insuficiente para %', deficit_list;
    END IF;

    -- Se passou na validação, cria as saídas e marca como completado
    PERFORM public.create_inventory_movement(
      smu.material_id, 'saida', smu.used_quantity, NEW.id, 'service', 'Uso em demanda: ' || NEW.title
    )
    FROM public.service_material_usage smu
    WHERE smu.service_id = NEW.id 
      AND COALESCE(smu.used_quantity, 0) > 0 
      AND NOT COALESCE(smu.is_completed, false);

    UPDATE public.service_material_usage 
    SET is_completed = true, updated_at = now()
    WHERE service_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recria o trigger para garantir que usa a versão atualizada
DROP TRIGGER IF EXISTS process_service_materials_trigger ON public.services;
CREATE TRIGGER process_service_materials_trigger
  AFTER UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.process_service_materials_completion();
