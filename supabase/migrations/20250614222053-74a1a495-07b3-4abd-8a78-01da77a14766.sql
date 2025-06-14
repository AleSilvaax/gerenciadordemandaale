
-- Habilitar Row Level Security (RLS) e criar políticas completas para service_types

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Permitir que administradores e gestores INSIRAM, ATUALIZEM e DELETEM tipos de serviço
CREATE POLICY "Admins e gestores podem manipular tipos de serviço"
  ON public.service_types
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('administrador', 'gestor'))
  WITH CHECK (public.get_current_user_role() IN ('administrador', 'gestor'));

-- Permitir que todos os logados possam ver tipos de serviço (para SELECT)
CREATE POLICY "Qualquer logado pode ver tipos de serviço"
  ON public.service_types
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Repetir para technical_fields, pois um cascade depende disso:
ALTER TABLE public.technical_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e gestores podem manipular campos técnicos"
  ON public.technical_fields
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('administrador', 'gestor'))
  WITH CHECK (public.get_current_user_role() IN ('administrador', 'gestor'));

CREATE POLICY "Qualquer logado pode ver campos técnicos"
  ON public.technical_fields
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Opcionalmente, regrant se quiser garantir permissionamento correto em cascata
-- (Isso já está modelado ON DELETE CASCADE para fields ao remover types.)
