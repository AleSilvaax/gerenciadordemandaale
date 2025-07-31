-- Atualizar política de acesso aos serviços para incluir super_admin corretamente
DROP POLICY IF EXISTS "Acesso organizacional aos serviços" ON services;

CREATE POLICY "Acesso organizacional aos serviços" ON services
FOR ALL
USING (
  -- Super admin pode acessar tudo
  is_super_admin() OR
  -- Owner pode acessar sua organização
  is_organization_owner(auth.uid(), organization_id) OR
  -- Usuários da mesma organização
  get_current_user_organization_id() = organization_id
)
WITH CHECK (
  -- Super admin pode criar/editar tudo
  is_super_admin() OR
  -- Owner pode criar/editar em sua organização
  is_organization_owner(auth.uid(), organization_id) OR
  -- Usuários da mesma organização podem criar/editar
  get_current_user_organization_id() = organization_id
);

-- Atualizar política de gerenciamento de usuários
DROP POLICY IF EXISTS "Admins e gestores podem gerenciar atribuições organizacionais" ON service_technicians;

CREATE POLICY "Gestão de atribuições organizacionais" ON service_technicians
FOR ALL
USING (
  -- Super admin pode gerenciar tudo
  is_super_admin() OR
  -- Admins e gestores podem gerenciar em sua organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    EXISTS (
      SELECT 1 FROM services s 
      WHERE s.id = service_technicians.service_id 
      AND s.organization_id = get_user_organization_safe()
    )
  )
)
WITH CHECK (
  -- Super admin pode atribuir tudo
  is_super_admin() OR
  -- Admins e gestores podem atribuir em sua organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    EXISTS (
      SELECT 1 FROM services s 
      WHERE s.id = service_technicians.service_id 
      AND s.organization_id = get_user_organization_safe()
    )
  )
);

-- Atualizar política de perfis para incluir super_admin
DROP POLICY IF EXISTS "Admins podem gerenciar perfis da organização" ON profiles;

CREATE POLICY "Gestão hierárquica de perfis" ON profiles
FOR ALL
USING (
  -- Super admin pode gerenciar todos
  is_super_admin() OR
  -- Owner, admin e gestor podem gerenciar perfis da organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    get_current_user_organization_id() = organization_id
  ) OR
  -- Usuário pode ver seu próprio perfil
  auth.uid() = id
)
WITH CHECK (
  -- Super admin pode criar/editar todos
  is_super_admin() OR
  -- Owner, admin e gestor podem criar/editar perfis da organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    get_current_user_organization_id() = organization_id
  ) OR
  -- Usuário pode editar seu próprio perfil
  auth.uid() = id
);

-- Atualizar política de gestão de tipos de serviço
DROP POLICY IF EXISTS "Admins and managers can manage service types" ON service_types;

CREATE POLICY "Gestão hierárquica de tipos de serviço" ON service_types
FOR ALL
USING (
  -- Super admin pode gerenciar todos
  is_super_admin() OR
  -- Owner, admin e gestor podem gerenciar tipos da organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    organization_id = get_current_user_organization_id()
  )
)
WITH CHECK (
  -- Super admin pode criar/editar todos
  is_super_admin() OR
  -- Owner, admin e gestor podem criar/editar tipos da organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    organization_id = get_current_user_organization_id()
  )
);

-- Atualizar política de gestão de campos técnicos
DROP POLICY IF EXISTS "Admins e gestores podem criar e editar campos técnicos" ON technical_fields;
DROP POLICY IF EXISTS "Admins e gestores podem manipular campos técnicos" ON technical_fields;

CREATE POLICY "Gestão hierárquica de campos técnicos" ON technical_fields
FOR ALL
USING (
  -- Super admin pode gerenciar todos
  is_super_admin() OR
  -- Owner, admin e gestor podem gerenciar campos da organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    organization_id = get_current_user_organization_id()
  )
)
WITH CHECK (
  -- Super admin pode criar/editar todos
  is_super_admin() OR
  -- Owner, admin e gestor podem criar/editar campos da organização
  (
    get_current_user_role() = ANY (ARRAY['owner', 'administrador', 'gestor']) AND
    organization_id = get_current_user_organization_id()
  )
);