-- Criação do sistema de materiais e estoque

-- Tabela de categorias de materiais
CREATE TABLE public.material_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  organization_id UUID NOT NULL DEFAULT get_current_user_organization_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de materiais
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT, -- Código do produto
  unit TEXT NOT NULL DEFAULT 'un', -- unidade, metro, kg, etc
  category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
  min_stock INTEGER DEFAULT 0, -- Estoque mínimo para alertas
  max_stock INTEGER DEFAULT 1000, -- Estoque máximo
  cost_per_unit DECIMAL(10,2) DEFAULT 0, -- Custo por unidade
  supplier TEXT, -- Fornecedor principal
  barcode TEXT, -- Código de barras
  location TEXT, -- Localização física
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL DEFAULT get_current_user_organization_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de estoque (inventário atual)
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0, -- Estoque reservado para demandas
  available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
  last_movement_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT get_current_user_organization_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_material_per_org UNIQUE(material_id, organization_id)
);

-- Tabela de movimentações de estoque
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'liberacao')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id UUID, -- ID da demanda, compra, etc
  reference_type TEXT, -- 'service', 'purchase', 'adjustment', etc
  notes TEXT,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * cost_per_unit) STORED,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  organization_id UUID NOT NULL DEFAULT get_current_user_organization_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela que relaciona tipos de serviço com materiais necessários
CREATE TABLE public.service_type_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_id UUID NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  default_quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT false, -- Se é obrigatório para este tipo de serviço
  organization_id UUID NOT NULL DEFAULT get_current_user_organization_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_service_material UNIQUE(service_type_id, material_id)
);

-- Tabela de materiais utilizados em cada demanda
CREATE TABLE public.service_material_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  planned_quantity INTEGER DEFAULT 0, -- Quantidade planejada
  used_quantity INTEGER DEFAULT 0, -- Quantidade realmente utilizada
  is_completed BOOLEAN DEFAULT false, -- Se a utilização foi finalizada
  notes TEXT,
  organization_id UUID NOT NULL DEFAULT get_current_user_organization_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_materials_organization ON public.materials(organization_id);
CREATE INDEX idx_materials_category ON public.materials(category_id);
CREATE INDEX idx_materials_sku ON public.materials(sku);
CREATE INDEX idx_inventory_material ON public.inventory(material_id);
CREATE INDEX idx_inventory_organization ON public.inventory(organization_id);
CREATE INDEX idx_movements_material ON public.inventory_movements(material_id);
CREATE INDEX idx_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX idx_movements_reference ON public.inventory_movements(reference_id, reference_type);
CREATE INDEX idx_service_materials_service ON public.service_type_materials(service_type_id);
CREATE INDEX idx_service_materials_material ON public.service_type_materials(material_id);
CREATE INDEX idx_usage_service ON public.service_material_usage(service_id);
CREATE INDEX idx_usage_material ON public.service_material_usage(material_id);

-- RLS Policies
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_type_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_material_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias de materiais
CREATE POLICY "Usuários podem ver categorias da organização" 
ON public.material_categories FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Gestores podem gerenciar categorias" 
ON public.material_categories FOR ALL 
USING (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
);

-- Políticas para materiais
CREATE POLICY "Usuários podem ver materiais da organização" 
ON public.materials FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Gestores podem gerenciar materiais" 
ON public.materials FOR ALL 
USING (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
);

-- Políticas para estoque
CREATE POLICY "Usuários podem ver estoque da organização" 
ON public.inventory FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Gestores podem gerenciar estoque" 
ON public.inventory FOR ALL 
USING (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
);

-- Políticas para movimentações
CREATE POLICY "Usuários podem ver movimentações da organização" 
ON public.inventory_movements FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Gestores podem criar movimentações" 
ON public.inventory_movements FOR INSERT 
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
);

-- Políticas para materiais de tipos de serviço
CREATE POLICY "Usuários podem ver materiais dos tipos de serviço" 
ON public.service_type_materials FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Gestores podem gerenciar materiais dos tipos de serviço" 
ON public.service_type_materials FOR ALL 
USING (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
)
WITH CHECK (
  (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) 
  AND organization_id = get_current_user_organization_id()
);

-- Políticas para uso de materiais em serviços
CREATE POLICY "Usuários podem ver uso de materiais da organização" 
ON public.service_material_usage FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Técnicos podem registrar uso de materiais em suas demandas" 
ON public.service_material_usage FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND (
    (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) OR
    (get_current_user_role() = 'tecnico' AND EXISTS (
      SELECT 1 FROM service_technicians st 
      WHERE st.service_id = service_material_usage.service_id 
      AND st.technician_id = auth.uid()
    ))
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND (
    (get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor'])) OR
    (get_current_user_role() = 'tecnico' AND EXISTS (
      SELECT 1 FROM service_technicians st 
      WHERE st.service_id = service_material_usage.service_id 
      AND st.technician_id = auth.uid()
    ))
  )
);

-- Funções para automatização
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Atualizar o estoque atual na tabela inventory
  UPDATE public.inventory 
  SET 
    current_stock = NEW.new_stock,
    last_movement_at = NEW.created_at,
    updated_at = now()
  WHERE material_id = NEW.material_id 
  AND organization_id = NEW.organization_id;
  
  -- Se não existe registro no inventory, criar
  IF NOT FOUND THEN
    INSERT INTO public.inventory (material_id, current_stock, organization_id)
    VALUES (NEW.material_id, NEW.new_stock, NEW.organization_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar estoque automaticamente
CREATE TRIGGER update_inventory_stock_trigger
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_stock();

-- Função para criar movimentação de estoque
CREATE OR REPLACE FUNCTION public.create_inventory_movement(
  p_material_id UUID,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_cost_per_unit DECIMAL DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Obter organização do usuário
  v_org_id := get_current_user_organization_id();
  
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
$$;

-- Função para processar materiais de uma demanda concluída
CREATE OR REPLACE FUNCTION public.process_service_materials_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  material_record RECORD;
BEGIN
  -- Só processar quando o status muda para 'concluido'
  IF OLD.status IS DISTINCT FROM 'concluido' AND NEW.status = 'concluido' THEN
    
    -- Para cada material usado na demanda
    FOR material_record IN 
      SELECT material_id, used_quantity
      FROM public.service_material_usage 
      WHERE service_id = NEW.id 
      AND used_quantity > 0 
      AND NOT is_completed
    LOOP
      -- Criar movimentação de saída
      PERFORM public.create_inventory_movement(
        material_record.material_id,
        'saida',
        material_record.used_quantity,
        NEW.id,
        'service',
        'Uso em demanda: ' || NEW.title
      );
    END LOOP;
    
    -- Marcar materiais como processados
    UPDATE public.service_material_usage 
    SET is_completed = true, updated_at = now()
    WHERE service_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para processar materiais quando demanda é concluída
CREATE TRIGGER process_service_materials_trigger
  AFTER UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.process_service_materials_completion();

-- Função para notificar estoque baixo
CREATE OR REPLACE FUNCTION public.check_low_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  material_name TEXT;
  alert_message TEXT;
BEGIN
  -- Verificar se o estoque atual está abaixo do mínimo
  IF NEW.current_stock <= (
    SELECT COALESCE(min_stock, 0) 
    FROM public.materials 
    WHERE id = NEW.material_id
  ) THEN
    
    -- Obter nome do material
    SELECT name INTO material_name
    FROM public.materials 
    WHERE id = NEW.material_id;
    
    -- Criar mensagem de alerta
    alert_message := 'Estoque baixo: ' || material_name || ' (Atual: ' || NEW.current_stock || ')';
    
    -- Notificar gestores e admins da organização
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

-- Trigger para alertas de estoque baixo
CREATE TRIGGER low_stock_alert_trigger
  AFTER UPDATE OF current_stock ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock_alerts();