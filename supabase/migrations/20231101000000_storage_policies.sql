
-- Criar função para configurar políticas de storage
CREATE OR REPLACE FUNCTION public.setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remover políticas existentes para evitar conflitos
  BEGIN
    DROP POLICY IF EXISTS "Avatar storage is publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Service photos are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload service photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update service photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete service photos" ON storage.objects;
  EXCEPTION
    WHEN others THEN
      -- Ignorar erros ao remover políticas inexistentes
  END;

  -- Criar buckets se não existirem
  BEGIN
    INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars');
  EXCEPTION
    WHEN others THEN
      -- Ignorar erro se o bucket já existir
  END;
  
  BEGIN
    INSERT INTO storage.buckets (id, name) VALUES ('service-photos', 'service-photos');
  EXCEPTION
    WHEN others THEN
      -- Ignorar erro se o bucket já existir
  END;

  -- Políticas para avatares
  CREATE POLICY "Avatar storage is publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Políticas para fotos de serviço (mais permissivas)
  CREATE POLICY "Service photos are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'service-photos');

  CREATE POLICY "Users can upload service photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'service-photos'
    );

  CREATE POLICY "Users can update service photos"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'service-photos'
    );

  CREATE POLICY "Users can delete service photos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'service-photos'
    );
END;
$$;

-- Execute a função para configurar as políticas
SELECT setup_storage_policies();
