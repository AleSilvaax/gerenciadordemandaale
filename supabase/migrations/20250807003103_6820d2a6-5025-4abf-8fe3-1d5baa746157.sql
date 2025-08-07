-- CORREÇÃO URGENTE: Simplificar políticas RLS dos serviços

-- 1. Remover políticas atuais e criar política simplificada
DROP POLICY IF EXISTS "Usuários podem ver serviços da organização" ON public.services;
DROP POLICY IF EXISTS "Usuários da mesma organização podem ver serviços" ON public.services;
DROP POLICY IF EXISTS "Admins podem ver todos os serviços da organização" ON public.services;
DROP POLICY IF EXISTS "Técnicos podem ver serviços atribuídos" ON public.services;

-- 2. Criar política simples e universal para SELECT
CREATE POLICY "Usuários autenticados podem ver serviços de sua organização" 
ON public.services 
FOR SELECT 
USING (
  -- Super admin pode ver tudo
  public.is_super_admin() OR
  -- Ou serviços da mesma organização
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND (
      p.organization_id = services.organization_id OR
      p.organization_id IS NULL OR
      services.organization_id IS NULL
    )
  )
);

-- 3. Manter políticas para outras operações (INSERT, UPDATE, DELETE) simples
DROP POLICY IF EXISTS "Usuários podem criar serviços" ON public.services;
CREATE POLICY "Usuários autenticados podem criar serviços" 
ON public.services 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários podem atualizar serviços" ON public.services;
CREATE POLICY "Gestores podem atualizar serviços" 
ON public.services 
FOR UPDATE 
USING (
  public.is_super_admin() OR
  public.get_effective_user_role() IN ('owner', 'administrador', 'gestor')
);

DROP POLICY IF EXISTS "Usuários podem deletar serviços" ON public.services;
CREATE POLICY "Admins podem deletar serviços" 
ON public.services 
FOR DELETE 
USING (
  public.is_super_admin() OR
  public.get_effective_user_role() IN ('owner', 'administrador')
);

-- 4. Garantir que a política de service_technicians também está correta
DROP POLICY IF EXISTS "Usuários podem ver atribuições de técnicos" ON public.service_technicians;
CREATE POLICY "Todos podem ver atribuições de técnicos" 
ON public.service_technicians 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Gestores podem gerenciar atribuições" ON public.service_technicians;
CREATE POLICY "Gestores podem gerenciar atribuições" 
ON public.service_technicians 
FOR ALL 
USING (
  public.is_super_admin() OR
  public.get_effective_user_role() IN ('owner', 'administrador', 'gestor')
);