import { supabase } from '@/integrations/supabase/client';
import { ServiceTypeConfig, TechnicalField } from '@/types/serviceTypes';

// ... gets all Service Types and CRUD for types & technical fields
export const getServiceTypesFromDatabase = async (): Promise<ServiceTypeConfig[]> => {
  try {
    const { data: types, error } = await supabase
      .from("service_types")
      .select("*");

    if (error || !types) {
      throw error || new Error("Falha ao carregar tipos");
    }

    // Busca fields para cada tipo de serviço
    const { data: allFields, error: fieldsError } = await supabase
      .from("technical_fields")
      .select("*");

    if (fieldsError) throw fieldsError;

    return types.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description ?? "",
      fields: (allFields || [])
        .filter((f) => f.service_type_id === type.id)
        .map((f) => {
          let options: string[] | undefined = undefined;
          if (f.options) {
            if (Array.isArray(f.options)) {
              // Safely map to strings
              const strArray = f.options.map(opt => String(opt));
              if (strArray.every(x => typeof x === "string")) {
                options = strArray;
              }
            } else if (typeof f.options === "string") {
              try {
                const parsed = JSON.parse(f.options);
                if (Array.isArray(parsed) && parsed.every(x => typeof x === "string")) {
                  options = parsed;
                }
              } catch {
                options = undefined;
              }
            } else if (typeof f.options === "object" && f.options !== null) {
              // Convert values to string array if possible
              const asArray = Object.values(f.options);
              if (Array.isArray(asArray) && asArray.every(x => typeof x === "string")) {
                options = asArray as string[];
              } else if (Array.isArray(asArray) && asArray.every(x => typeof x === "number" || typeof x === "boolean")) {
                options = asArray.map(x => String(x));
              }
              // If not all strings (after conversion), leave options undefined
            }
          }

          return {
            id: f.id,
            name: f.name,
            type: f.type as TechnicalField["type"],
            required: f.required,
            description: f.description,
            options,
          } as TechnicalField;
        }),
    }));
  } catch (e) {
    console.error("Erro ao buscar tipos de serviço:", e);
    return [];
  }
};

export const createServiceType = async (type: Partial<ServiceTypeConfig>) => {
  const { data, error } = await supabase
    .from("service_types")
    .insert({ name: type.name, description: type.description })
    .select()
    .single();
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("technical_fields")
    .insert({
      service_type_id: serviceTypeId,
      name: field.name,
      description: field.description,
      type: field.type,
      required: field.required,
      options: field.options ? JSON.stringify(field.options) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
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
