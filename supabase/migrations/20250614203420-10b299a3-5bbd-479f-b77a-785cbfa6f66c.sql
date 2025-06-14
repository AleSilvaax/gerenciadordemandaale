
-- Adiciona campos faltantes à tabela services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS client TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours INTEGER,
  ADD COLUMN IF NOT EXISTS photos TEXT[],
  ADD COLUMN IF NOT EXISTS photo_titles TEXT[],
  ADD COLUMN IF NOT EXISTS signatures JSONB,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- Adiciona coluna date para registrar data do serviço, se necessário
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;

-- Garante que report_data tenha foreign key para services
ALTER TABLE public.report_data
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);

-- Adiciona índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_services_id ON public.services(id);
CREATE INDEX IF NOT EXISTS idx_report_data_service_id ON public.report_data(service_id);
