
-- 1. Adicionar campo service_type_id na tabela services, referenciando service_types(id)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS service_type_id uuid REFERENCES public.service_types(id);

-- 2. (opcional, mas recomendado) Atualizar políticas para permitir o uso do novo campo, se necessário (não é obrigatório alterar o insert policy atual pois ela faz check apenas em created_by).
