-- Corrigir policies para tabela profiles permitir acesso admin
DROP POLICY IF EXISTS "Owners podem ver perfis de sua organização" ON public.profiles;
DROP POLICY IF EXISTS "Super admins podem ver todos os perfis" ON public.profiles;

-- Nova policy mais permissiva para administradores
CREATE POLICY "Admins podem gerenciar perfis da organização" 
ON public.profiles 
FOR ALL 
USING (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text]) AND 
   get_current_user_organization_id() = organization_id)
)
WITH CHECK (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text]) AND 
   get_current_user_organization_id() = organization_id)
);

-- Policy para usuários verem apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Corrigir policies para user_invites
DROP POLICY IF EXISTS "Admins can manage invites in their organization" ON public.user_invites;

CREATE POLICY "Admins podem gerenciar convites da organização" 
ON public.user_invites 
FOR ALL 
USING (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text]) AND 
   organization_id = get_current_user_organization_id())
)
WITH CHECK (
  is_super_admin() OR 
  (get_current_user_role() = ANY (ARRAY['administrador'::text, 'gestor'::text]) AND 
   organization_id = get_current_user_organization_id())
);