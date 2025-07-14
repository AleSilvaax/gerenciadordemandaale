
-- Criar tabela para agendamentos de técnicos
CREATE TABLE public.technician_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  service_id UUID REFERENCES public.services(id),
  technician_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.technician_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agendamentos
CREATE POLICY "Técnicos podem ver seus próprios agendamentos" 
  ON public.technician_schedule 
  FOR SELECT 
  USING (technician_id = auth.uid());

CREATE POLICY "Técnicos podem criar seus próprios agendamentos" 
  ON public.technician_schedule 
  FOR INSERT 
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Técnicos podem atualizar seus próprios agendamentos" 
  ON public.technician_schedule 
  FOR UPDATE 
  USING (technician_id = auth.uid());

CREATE POLICY "Administradores podem gerenciar todos os agendamentos" 
  ON public.technician_schedule 
  FOR ALL 
  USING (get_current_user_role() = 'administrador')
  WITH CHECK (get_current_user_role() = 'administrador');

CREATE POLICY "Gestores podem gerenciar todos os agendamentos" 
  ON public.technician_schedule 
  FOR ALL 
  USING (get_current_user_role() = 'gestor')
  WITH CHECK (get_current_user_role() = 'gestor');

-- Habilitar realtime para a tabela
ALTER publication supabase_realtime ADD TABLE public.technician_schedule;
