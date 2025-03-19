
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getServiceById } from './serviceDetailsAPI';

// Update report data
export async function updateReportData(serviceId: string, data: any): Promise<boolean> {
  try {
    console.log("Updating report data for service:", serviceId);
    
    // Check if report data exists
    const { data: existingData, error: checkError } = await supabase
      .from('report_data')
      .select('id')
      .eq('id', serviceId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking report data:", checkError);
      throw checkError;
    }
    
    if (existingData) {
      // Update existing report data
      const { error: updateError } = await supabase
        .from('report_data')
        .update({
          client: data.client,
          address: data.address,
          city: data.city,
          executed_by: data.executedBy,
          installation_date: data.installationDate,
          model_number: data.modelNumber,
          serial_number_new: data.serialNumberNew,
          serial_number_old: data.serialNumberOld,
          homologated_name: data.homologatedName,
          complies_with_nbr17019: data.compliesWithNBR17019,
          homologated_installation: data.homologatedInstallation,
          required_adjustment: data.requiredAdjustment,
          adjustment_description: data.adjustmentDescription,
          valid_warranty: data.validWarranty,
          circuit_breaker_entry: data.circuitBreakerEntry,
          charger_circuit_breaker: data.chargerCircuitBreaker,
          cable_gauge: data.cableGauge,
          charger_status: data.chargerStatus,
          technical_comments: data.technicalComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (updateError) {
        console.error("Error updating report data:", updateError);
        throw updateError;
      }
    } else {
      // Insert new report data
      const { error: insertError } = await supabase
        .from('report_data')
        .insert({
          id: serviceId,
          client: data.client,
          address: data.address,
          city: data.city,
          executed_by: data.executedBy,
          installation_date: data.installationDate,
          model_number: data.modelNumber,
          serial_number_new: data.serialNumberNew,
          serial_number_old: data.serialNumberOld,
          homologated_name: data.homologatedName,
          complies_with_nbr17019: data.compliesWithNBR17019,
          homologated_installation: data.homologatedInstallation,
          required_adjustment: data.requiredAdjustment,
          adjustment_description: data.adjustmentDescription,
          valid_warranty: data.validWarranty,
          circuit_breaker_entry: data.circuitBreakerEntry,
          charger_circuit_breaker: data.chargerCircuitBreaker,
          cable_gauge: data.cableGauge,
          charger_status: data.chargerStatus,
          technical_comments: data.technicalComments
        });
      
      if (insertError) {
        console.error("Error inserting report data:", insertError);
        throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateReportData:", error);
    toast.error("Erro ao atualizar dados do relatório");
    return false;
  }
}
