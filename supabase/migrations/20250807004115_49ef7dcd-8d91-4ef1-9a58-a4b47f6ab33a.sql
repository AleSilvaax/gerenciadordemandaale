-- CORREÇÃO URGENTE: Remover recursão infinita nas políticas RLS

-- 1. Remover todas as políticas problemáticas da tabela services
DROP POLICY IF EXISTS "Acesso organizacional aos serviços" ON public.services;
DROP POLICY IF EXISTS "Admins e tecnicos podem atualizar demandas" ON public.services;
DROP POLICY IF EXISTS "Admins podem apagar demandas" ON public.services;
DROP POLICY IF EXISTS "Admins podem deletar serviços" ON public.services;
DROP POLICY IF EXISTS "Gestores podem atualizar serviços" ON public.services;
DROP POLICY IF EXISTS "Gestores podem ver TODAS as demandas de sua equipe" ON public.services;
DROP POLICY IF EXISTS "Permitir visualização de serviços" ON public.services;
DROP POLICY IF EXISTS "Super admins podem ver todos os serviços" ON public.services;
DROP POLICY IF EXISTS "Técnicos podem ver apenas suas demandas atribuídas" ON public.services;
DROP POLICY IF EXISTS "Usuarios autenticados podem criar demandas" ON public.services;
DROP POLICY IF EXISTS "Usuários autenticados podem criar serviços" ON public.services;
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
DROP POLICY IF EXISTS "services_update_policy" ON public.services;

-- 2. Criar políticas simples e funcionais para services
CREATE POLICY "services_select_simple" ON public.services 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "services_insert_simple" ON public.services 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "services_update_simple" ON public.services 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "services_delete_simple" ON public.services 
FOR DELETE 
USING (auth.uid() = created_by OR get_current_user_role() IN ('administrador', 'super_admin'));

-- 3. Corrigir também service_technicians para evitar problemas
DROP POLICY IF EXISTS "Admins e gestores podem gerenciar atribuições" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestores podem gerenciar atribuições" ON public.service_technicians;
DROP POLICY IF EXISTS "Gestão de atribuições organizacionais" ON public.service_technicians;
DROP POLICY IF EXISTS "Técnicos podem ver suas próprias atribuições" ON public.service_technicians;
DROP POLICY IF EXISTS "Visualizar atribuições de técnicos" ON public.service_technicians;
DROP POLICY IF EXISTS "service_technicians_delete_policy" ON public.service_technicians;
DROP POLICY IF EXISTS "service_technicians_insert_policy" ON public.service_technicians;
DROP POLICY IF EXISTS "service_technicians_select_policy" ON public.service_technicians;
DROP POLICY IF EXISTS "service_technicians_update_policy" ON public.service_technicians;

-- 4. Criar políticas simples para service_technicians
CREATE POLICY "service_technicians_select_simple" ON public.service_technicians 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_technicians_insert_simple" ON public.service_technicians 
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('administrador', 'gestor', 'super_admin'));

CREATE POLICY "service_technicians_update_simple" ON public.service_technicians 
FOR UPDATE 
USING (get_current_user_role() IN ('administrador', 'gestor', 'super_admin'));

CREATE POLICY "service_technicians_delete_simple" ON public.service_technicians 
FOR DELETE 
USING (get_current_user_role() IN ('administrador', 'gestor', 'super_admin'));