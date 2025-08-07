-- CORREÇÃO CRÍTICA: Políticas RLS específicas para visibilidade de demandas por role

-- 1. Remover política atual muito permissiva
DROP POLICY IF EXISTS "services_select_simple" ON public.services;

-- 2. Criar políticas específicas por tipo de usuário

-- TÉCNICOS: Só podem ver demandas atribuídas a eles
CREATE POLICY "Técnicos veem apenas demandas atribuídas" ON public.services 
FOR SELECT 
USING (
  get_current_user_role() = 'tecnico' AND 
  EXISTS (
    SELECT 1 FROM public.service_technicians st 
    WHERE st.service_id = services.id 
    AND st.technician_id = auth.uid()
  )
);

-- GESTORES E ADMINS: Podem ver todas as demandas da organização
CREATE POLICY "Gestores e admins veem demandas da organização" ON public.services 
FOR SELECT 
USING (
  get_current_user_role() IN ('gestor', 'administrador', 'owner') AND 
  organization_id = get_current_user_organization_id()
);

-- SUPER ADMINS: Podem ver tudo
CREATE POLICY "Super admins veem todas as demandas" ON public.services 
FOR SELECT 
USING (get_current_user_role() = 'super_admin');

-- CRIADORES: Podem ver demandas que criaram (fallback para requisitores)
CREATE POLICY "Criadores veem suas próprias demandas" ON public.services 
FOR SELECT 
USING (auth.uid() = created_by);