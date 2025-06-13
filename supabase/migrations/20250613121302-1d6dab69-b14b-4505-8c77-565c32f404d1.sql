
-- Primeiro, vamos habilitar RLS nas tabelas principais se ainda não estiver ativo
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar com controle adequado
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_roles;

-- Políticas para a tabela SERVICES (Demandas)
DROP POLICY IF EXISTS "Services select policy" ON public.services;
DROP POLICY IF EXISTS "Services insert policy" ON public.services;
DROP POLICY IF EXISTS "Services update policy" ON public.services;
DROP POLICY IF EXISTS "Services delete policy" ON public.services;

-- Administradores podem fazer tudo com services
CREATE POLICY "Admins can do everything with services"
ON public.services FOR ALL TO authenticated
USING (public.get_user_role_safe(auth.uid()) = 'administrador')
WITH CHECK (public.get_user_role_safe(auth.uid()) = 'administrador');

-- Gestores podem ver, criar, editar e apagar demandas da sua equipe
CREATE POLICY "Gestores podem gerenciar demandas da sua equipe"
ON public.services FOR ALL TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'gestor' AND
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  public.get_user_role_safe(auth.uid()) = 'gestor' AND
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- Técnicos podem ver e editar apenas demandas atribuídas a eles
CREATE POLICY "Tecnicos podem ver demandas atribuidas"
ON public.services FOR SELECT TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'tecnico' AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

CREATE POLICY "Tecnicos podem editar demandas atribuidas"
ON public.services FOR UPDATE TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'tecnico' AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
)
WITH CHECK (
  public.get_user_role_safe(auth.uid()) = 'tecnico' AND
  id IN (SELECT service_id FROM public.service_technicians WHERE technician_id = auth.uid())
);

-- Políticas para a tabela PROFILES (Perfis)
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- Administradores podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.get_user_role_safe(auth.uid()) = 'administrador');

-- Gestores podem ver perfis da sua equipe
CREATE POLICY "Gestores podem ver perfis da sua equipe"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'gestor' AND
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- Técnicos podem ver apenas seu próprio perfil
CREATE POLICY "Tecnicos podem ver proprio perfil"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'tecnico' AND
  id = auth.uid()
);

-- Todos podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Políticas para a tabela TEAMS (Equipes)
DROP POLICY IF EXISTS "Teams select policy" ON public.teams;

-- Administradores podem ver todas as equipes
CREATE POLICY "Admins can view all teams"
ON public.teams FOR ALL TO authenticated
USING (public.get_user_role_safe(auth.uid()) = 'administrador')
WITH CHECK (public.get_user_role_safe(auth.uid()) = 'administrador');

-- Gestores e técnicos podem ver dados da sua própria equipe
CREATE POLICY "Users can view own team"
ON public.teams FOR SELECT TO authenticated
USING (
  id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- Políticas para SERVICE_TECHNICIANS
DROP POLICY IF EXISTS "Service technicians policy" ON public.service_technicians;

-- Administradores podem fazer tudo
CREATE POLICY "Admins can manage service technicians"
ON public.service_technicians FOR ALL TO authenticated
USING (public.get_user_role_safe(auth.uid()) = 'administrador')
WITH CHECK (public.get_user_role_safe(auth.uid()) = 'administrador');

-- Gestores podem gerenciar atribuições da sua equipe
CREATE POLICY "Gestores podem gerenciar atribuicoes da equipe"
ON public.service_technicians FOR ALL TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'gestor' AND
  service_id IN (
    SELECT id FROM public.services 
    WHERE team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  public.get_user_role_safe(auth.uid()) = 'gestor' AND
  service_id IN (
    SELECT id FROM public.services 
    WHERE team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Técnicos podem ver suas próprias atribuições
CREATE POLICY "Tecnicos podem ver proprias atribuicoes"
ON public.service_technicians FOR SELECT TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'tecnico' AND
  technician_id = auth.uid()
);

-- Políticas para SERVICE_MESSAGES
DROP POLICY IF EXISTS "Service messages policy" ON public.service_messages;

-- Usuários podem ver mensagens de serviços que têm acesso
CREATE POLICY "Users can view service messages"
ON public.service_messages FOR SELECT TO authenticated
USING (
  service_id IN (SELECT id FROM public.services)
);

-- Usuários podem inserir mensagens em serviços que têm acesso
CREATE POLICY "Users can insert service messages"
ON public.service_messages FOR INSERT TO authenticated
WITH CHECK (
  service_id IN (SELECT id FROM public.services)
);

-- Políticas para USER_ROLES
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Administradores podem ver todos os papéis
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.get_user_role_safe(auth.uid()) = 'administrador');

-- Apenas administradores podem inserir/atualizar papéis
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.get_user_role_safe(auth.uid()) = 'administrador')
WITH CHECK (public.get_user_role_safe(auth.uid()) = 'administrador');
