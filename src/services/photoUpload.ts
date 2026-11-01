import { supabase } from '@/integrations/supabase/client';

/**
 * Envia uma foto para o bucket service-photos e registra em service_photos,
 * gravando o caminho permanente do Storage (URLs assinadas expiram).
 */
export const uploadServicePhoto = async (
  serviceId: string,
  file: File,
  title?: string
): Promise<{ path: string; signedUrl: string; dbId: string; title: string }> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${serviceId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('service-photos')
    .upload(filename, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Falha no upload: ${error.message}`);

  const { data: signed, error: signError } = await supabase.storage
    .from('service-photos')
    .createSignedUrl(data.path, 3600);
  if (signError) throw new Error(`Erro ao gerar URL da foto: ${signError.message}`);

  const photoTitle = title || file.name.replace(/\.[^/.]+$/, '');
  const { data: row, error: dbError } = await supabase
    .from('service_photos')
    .insert({ service_id: serviceId, photo_url: data.path, title: photoTitle })
    .select('id')
    .single();
  if (dbError) throw new Error(`Erro ao salvar foto: ${dbError.message}`);

  return { path: data.path, signedUrl: signed.signedUrl, dbId: String(row.id), title: photoTitle };
};

/** Espelha service_photos nos campos photos/photo_titles da tabela services. */
export const syncServicePhotosFields = async (serviceId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('service_photos')
    .select('photo_url,title')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const { error: updateError } = await supabase
    .from('services')
    .update({
      photos: (data || []).map(p => p.photo_url),
      photo_titles: (data || []).map(p => p.title || ''),
    })
    .eq('id', serviceId);
  if (updateError) throw updateError;
};
