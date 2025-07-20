
import { supabase } from '@/integrations/supabase/client';
import { ServiceTypeConfig, TechnicalField } from '@/types/serviceTypes';

export const getServiceTypesFromDatabase = async (): Promise<ServiceTypeConfig[]> => {
  try {
    console.log('[ServiceTypes] Iniciando busca de tipos de serviço...');
    
    const { data: types, error } = await supabase
      .from("service_types")
      .select("*")
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ServiceTypes] Erro ao buscar tipos:', error);
      throw error;
    }

    if (!types || types.length === 0) {
      console.log('[ServiceTypes] Nenhum tipo encontrado, retornando tipos padrão');
      return [
        { id: '1', name: 'Vistoria', description: 'Vistoria padrão', fields: [] },
        { id: '2', name: 'Instalação', description: 'Instalação padrão', fields: [] },
        { id: '3', name: 'Manutenção', description: 'Manutenção padrão', fields: [] }
      ];
    }

    console.log('[ServiceTypes] Tipos encontrados:', types.length);

    // Busca fields para cada tipo de serviço
    const { data: allFields, error: fieldsError } = await supabase
      .from("technical_fields")
      .select("*")
      .order('created_at', { ascending: true });

    if (fieldsError) {
      console.error('[ServiceTypes] Erro ao buscar fields:', fieldsError);
    }

    const result = types
      .filter(type => type && type.name && type.name.trim() !== '') // Filtrar tipos inválidos
      .map((type) => ({
        id: type.id,
        name: type.name.trim(),
        description: type.description?.trim() || "",
        fields: (allFields || [])
          .filter((f) => f && f.service_type_id === type.id && f.name && f.name.trim() !== '')
          .map((f) => {
            let options: string[] | undefined = undefined;
            if (f.options) {
              if (Array.isArray(f.options)) {
                const strArray = f.options.map(opt => String(opt)).filter(opt => opt.trim() !== '');
                if (strArray.length > 0) {
                  options = strArray;
                }
              } else if (typeof f.options === "string" && f.options.trim() !== '') {
                try {
                  const parsed = JSON.parse(f.options);
                  if (Array.isArray(parsed)) {
                    const validOptions = parsed.map(x => String(x)).filter(x => x.trim() !== '');
                    if (validOptions.length > 0) {
                      options = validOptions;
                    }
                  }
                } catch {
                  options = undefined;
                }
              } else if (typeof f.options === "object" && f.options !== null) {
                const asArray = Object.values(f.options);
                if (Array.isArray(asArray)) {
                  const validOptions = asArray.map(x => String(x)).filter(x => x.trim() !== '');
                  if (validOptions.length > 0) {
                    options = validOptions;
                  }
                }
              }
            }

            return {
              id: f.id,
              name: f.name.trim(),
              type: f.type as TechnicalField["type"],
              required: Boolean(f.required),
              description: f.description?.trim() || undefined,
              options,
            } as TechnicalField;
          }),
      }));

    console.log('[ServiceTypes] Resultado processado:', result.length, 'tipos válidos');
    return result;
  } catch (e) {
    console.error("Erro ao buscar tipos de serviço:", e);
    // Retornar tipos padrão em caso de erro
    return [
      { id: '1', name: 'Vistoria', description: 'Vistoria padrão', fields: [] },
      { id: '2', name: 'Instalação', description: 'Instalação padrão', fields: [] },
      { id: '3', name: 'Manutenção', description: 'Manutenção padrão', fields: [] }
    ];
  }
};

export const createServiceType = async (type: Partial<ServiceTypeConfig>) => {
  try {
    console.log('[ServiceTypes] Criando tipo de serviço:', type);
    
    const { data, error } = await supabase
      .from("service_types")
      .insert({ 
        name: type.name, 
        description: type.description,
        organization_id: null // Não usar organização por enquanto
      })
      .select()
      .single();
      
    if (error) {
      console.error('[ServiceTypes] Erro ao criar tipo:', error);
      throw error;
    }
    
    console.log('[ServiceTypes] Tipo criado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('[ServiceTypes] Erro no createServiceType:', error);
    throw error;
  }
};

export const updateServiceType = async (type: ServiceTypeConfig) => {
  const { data, error } = await supabase
    .from("service_types")
    .update({ name: type.name, description: type.description })
    .eq("id", type.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteServiceType = async (id: string) => {
  const { error } = await supabase.from("service_types").delete().eq("id", id);
  if (error) throw error;
};

export const createTechnicalField = async (serviceTypeId: string, field: Omit<TechnicalField, "id">) => {
  try {
    const { data, error } = await supabase
      .from("technical_fields")
      .insert({
        service_type_id: serviceTypeId,
        name: field.name,
        description: field.description,
        type: field.type,
        required: field.required,
        options: field.options ? JSON.stringify(field.options) : null,
        organization_id: null // Não usar organização por enquanto
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[ServiceTypes] Erro ao criar campo técnico:', error);
    throw error;
  }
};

export const updateTechnicalField = async (field: TechnicalField) => {
  const { data, error } = await supabase
    .from("technical_fields")
    .update({
      name: field.name,
      description: field.description,
      type: field.type,
      required: field.required,
      options: field.options ? JSON.stringify(field.options) : null,
    })
    .eq("id", field.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTechnicalField = async (fieldId: string) => {
  const { error } = await supabase.from("technical_fields").delete().eq("id", fieldId);
  if (error) throw error;
};
