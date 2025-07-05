
-- FASE 1: Limpeza Total do Database
-- Excluir TODAS as políticas RLS da tabela service_photos
DROP POLICY IF EXISTS "Administradores e gestores podem excluir fotos" ON public.service_photos;
DROP POLICY IF EXISTS "Allow all users to delete service_photos" ON public.service_photos;
DROP POLICY IF EXISTS "Allow all users to insert service_photos" ON public.service_photos;
DROP POLICY IF EXISTS "Allow all users to select service_photos" ON public.service_photos;
DROP POLICY IF EXISTS "Allow all users to update service_photos" ON public.service_photos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.service_photos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.service_photos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.service_photos;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.service_photos;
DROP POLICY IF EXISTS "Técnicos, administradores e gestores podem atualizar fotos" ON public.service_photos;
DROP POLICY IF EXISTS "Técnicos, administradores e gestores podem inserir fotos" ON public.service_photos;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar fotos" ON public.service_photos;

-- Excluir bucket duplicado service_photos do storage
DELETE FROM storage.buckets WHERE id = 'service_photos';

-- Recriar a tabela service_photos com estrutura correta
DROP TABLE IF EXISTS public.service_photos;

CREATE TABLE public.service_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.service_photos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS simples e funcionais
CREATE POLICY "Authenticated users can view photos"
ON public.service_photos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert photos"
ON public.service_photos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update photos"
ON public.service_photos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete photos"
ON public.service_photos FOR DELETE
TO authenticated
USING (true);

-- Configurar políticas de storage para o bucket service-photos
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_3" ON storage.objects;

-- Criar políticas simples para o storage
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-photos');

CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-photos')
WITH CHECK (bucket_id = 'service-photos');
