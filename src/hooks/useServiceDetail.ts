// Copie e cole esta função para substituir a existente em src/hooks/useServiceDetail.ts

const handlePhotosChange = async (newPhotos: UploaderPhoto[]) => {
    if (!service) return;

    try {
      toast.info("A processar e a salvar as fotos...");
      setIsLoading(true);

      const uploadPromises = newPhotos.map(async (photo) => {
        // Apenas faz upload se for um novo ficheiro
        if (photo.file instanceof File) {
            console.log(`[DEBUG] A fazer upload do ficheiro: ${photo.file.name}`);
            const publicUrl = await uploadServicePhoto(photo.file);
            
            // --- VARIÁVEL DE VERIFICAÇÃO ---
            // Vamos ver no console exatamente o que o Supabase nos deu.
            console.log(`[DEBUG] Supabase Storage retornou a URL: ${publicUrl}`);
            toast.info(`URL recebida do Supabase. Verifique o console.`); 
            // ------------------------------------
            
            return { url: publicUrl, title: photo.title };
        }
        
        // Se a foto já existe (tem uma URL http), apenas a mantém
        if (typeof photo.url === 'string' && photo.url.startsWith('http')) {
          return { url: photo.url, title: photo.title };
        }
        
        return null;
      });

      const resolvedPhotos = (await Promise.all(uploadPromises)).filter(p => p !== null);
      const photoUrls = resolvedPhotos.map(p => p!.url);
      const photoTitles = resolvedPhotos.map(p => p!.title);
      
      // --- VERIFICAÇÃO 2 ---
      console.log('[DEBUG] URLs que serão salvas na base de dados:', photoUrls);
      // ----------------------

      await updateService({ 
        id: service.id, 
        photos: photoUrls,
        photoTitles: photoTitles
      });
      
      toast.success("Processo de salvamento concluído!");
      await fetchService(service.id);

    } catch (error) {
      console.error("Erro detalhado ao atualizar fotos:", error);
      toast.error("Ocorreu um erro ao salvar as fotos. Verifique o console.");
    } finally {
      setIsLoading(false);
    }
  };
