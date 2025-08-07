-- FASE 1: CORREÇÃO CRÍTICA DAS POLÍTICAS RLS
-- Remover todas as políticas problemáticas que estão causando recursão infinita

-- Dropar políticas existentes da tabela services
DROP POLICY IF EXISTS "Administradores podem ver todos os serviços" ON public.services;
DROP POLICY IF EXISTS "Gestores podem ver demandas de sua equipe" ON public.services;
DROP POLICY IF EXISTS "Gestores podem ver demandas de técnicos de sua equipe" ON public.services;
DROP POLICY IF EXISTS "Técnicos podem ver serviços atribuídos" ON public.services;
DROP POLICY IF EXISTS "Usuários podem ver serviços que criaram" ON public.services;
DROP POLICY IF EXISTS "Users can view their own services" ON public.services;
DROP POLICY IF EXISTS "Users can create services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;

-- Dropar políticas existentes da tabela service_technicians
DROP POLICY IF EXISTS "Técnicos podem ver suas atribuições" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores podem gerenciar atribuições de sua equipe" ON public.service_technicians;
DROP POLICY IF EXISTS "Administradores podem gerenciar todas as atribuições" ON public.service_technicians;
DROP POLICY IF EXISTS "Users can view service technician assignments" ON public.service_technicians;
DROP POLICY IF EXISTS "Users can create service technician assignments" ON public.service_technicians;
DROP POLICY IF EXISTS "Users can update service technician assignments" ON public.service_technicians;
DROP POLICY IF EXISTS "Users can delete service technician assignments" ON public.service_technicians;

-- CRIAR POLÍTICAS SIMPLIFICADAS E SEGURAS

-- 1. POLÍTICAS PARA A TABELA SERVICES
-- Política unificada para leitura de serviços
CREATE POLICY "services_select_policy" ON public.services
FOR SELECT USING (
  -- Super admins veem tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins veem serviços da sua organização
  (
    public.get_effective_user_role() = 'administrador' 
    AND organization_id = public.get_user_organization_safe()
  )
  OR
  -- Gestores veem serviços de sua equipe OU criados por eles
  (
    public.get_effective_user_role() = 'gestor' 
    AND (
      team_id = public.get_current_user_team_id()
      OR created_by = auth.uid()
    )
    AND organization_id = public.get_user_organization_safe()
  )
  OR
  -- Técnicos veem apenas serviços criados por eles
  (
    public.get_effective_user_role() = 'tecnico' 
    AND created_by = auth.uid()
  )
  OR
  -- Usuários veem serviços que criaram
  (created_by = auth.uid())
);

-- Política para inserção de serviços
CREATE POLICY "services_insert_policy" ON public.services
FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND organization_id = public.get_user_organization_safe()
);

-- Política para atualização de serviços
CREATE POLICY "services_update_policy" ON public.services
FOR UPDATE USING (
  -- Super admins podem atualizar tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins podem atualizar serviços da organização
  (
    public.get_effective_user_role() = 'administrador' 
    AND organization_id = public.get_user_organization_safe()
  )
  OR
  -- Gestores podem atualizar serviços de sua equipe
  (
    public.get_effective_user_role() = 'gestor' 
    AND team_id = public.get_current_user_team_id()
    AND organization_id = public.get_user_organization_safe()
  )
  OR
  -- Criador pode atualizar seus próprios serviços
  (created_by = auth.uid())
);

-- Política para exclusão de serviços
CREATE POLICY "services_delete_policy" ON public.services
FOR DELETE USING (
  -- Super admins podem excluir tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins podem excluir serviços da organização
  (
    public.get_effective_user_role() = 'administrador' 
    AND organization_id = public.get_user_organization_safe()
  )
  OR
  -- Criador pode excluir seus próprios serviços
  (created_by = auth.uid())
);

-- 2. POLÍTICAS PARA A TABELA SERVICE_TECHNICIANS
-- Política simplificada para leitura
CREATE POLICY "service_technicians_select_policy" ON public.service_technicians
FOR SELECT USING (
  -- Super admins veem tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins veem atribuições da organização
  (public.get_effective_user_role() = 'administrador')
  OR
  -- Gestores veem atribuições de sua equipe
  (public.get_effective_user_role() = 'gestor')
  OR
  -- Técnico vê suas próprias atribuições
  (technician_id = auth.uid())
);

-- Política para inserção de atribuições
CREATE POLICY "service_technicians_insert_policy" ON public.service_technicians
FOR INSERT WITH CHECK (
  -- Super admins podem criar qualquer atribuição
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins podem criar atribuições
  (public.get_effective_user_role() = 'administrador')
  OR
  -- Gestores podem criar atribuições
  (public.get_effective_user_role() = 'gestor')
);

-- Política para atualização de atribuições
CREATE POLICY "service_technicians_update_policy" ON public.service_technicians
FOR UPDATE USING (
  -- Super admins podem atualizar tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins podem atualizar atribuições
  (public.get_effective_user_role() = 'administrador')
  OR
  -- Gestores podem atualizar atribuições
  (public.get_effective_user_role() = 'gestor')
);

-- Política para exclusão de atribuições
CREATE POLICY "service_technicians_delete_policy" ON public.service_technicians
FOR DELETE USING (
  -- Super admins podem excluir tudo
  (public.get_effective_user_role() = 'super_admin')
  OR
  -- Admins podem excluir atribuições
  (public.get_effective_user_role() = 'administrador')
  OR
  -- Gestores podem excluir atribuições
  (public.get_effective_user_role() = 'gestor')
);