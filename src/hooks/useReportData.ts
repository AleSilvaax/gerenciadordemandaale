
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateService } from "@/services/api";
import { Service } from "@/types/serviceTypes";

/**
 * Hook para lidar com a lógica de salvar dados do relatório (report_data).
 * Retorna um handler e estado de loading.
 */
export function useReportData(service: Service | null, id: string | undefined, onUpdateLocalService: (mergedReportData: any) => void) {
  const [saving, setSaving] = useState(false);

  const handleSaveReportData = async (data: any) => {
    if (!service || !id) return;
    setSaving(true);
    try {
      const dbData: { [key: string]: any } = {
        installation_date: data.installationDate,
        model_number: data.modelNumber,
        serial_number_new: data.serialNumberNew,
        cable_gauge: data.cableGauge,
        charger_circuit_breaker: data.chargerCircuitBreaker,
        complies_with_nbr17019: data.compliesWithNBR17019 ? data.compliesWithNBR17019 === 'sim' : undefined,
        homologated_installation: data.homologatedInstallation ? data.homologatedInstallation === 'sim' : undefined,
        technical_comments: data.technicalComments,
      };

      Object.keys(dbData).forEach(key => (dbData[key] === undefined || dbData[key] === null) && delete dbData[key]);

      if (Object.keys(dbData).length > 0) {
        const { error } = await supabase
          .from('report_data')
          .update(dbData)
          .eq('id', id);

        if (error) {
          const { error: insertError } = await supabase
            .from('report_data')
            .insert({ id, ...dbData });

          if (insertError) {
            console.error('Erro ao inserir dados do relatório:', insertError);
            throw insertError;
          }
        }
      }

      // Atualiza o estado local via callback prop vinda de ServiceDetail
      const mergedReportData = { ...service.reportData, ...data };
      onUpdateLocalService(mergedReportData);
      toast.success('Dados do relatório salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      toast.error('Erro ao salvar dados do relatório. Verifique os dados e a conexão.');
    } finally {
      setSaving(false);
    }
  };

  return { saving, handleSaveReportData };
}
