// Copie este código completo para o seu ficheiro: src/pages/ServiceDetail.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import { generateDetailedServiceReport } from "@/utils/detailedReportGenerator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; 
import { ServiceDetailHeader } from "@/components/service-detail/ServiceDetailHeader";
import { ServiceDetailCard } from "@/components/service-detail/ServiceDetailCard";
import { ServiceActions } from "@/components/service-detail/ServiceActions";
import { ServiceMessages } from "@/components/service-detail/ServiceMessages";
import { ServiceFeedback } from "@/components/service-detail/ServiceFeedback";
import { useServiceDetail } from "@/hooks/useServiceDetail";

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const {
    service,
    isLoading,
    newMessage,
    setNewMessage,
    feedback,
    setFeedback,
    photos,
    navigate,
    fetchService,
    handleStatusChange,
    handleSendMessage,
    handleSubmitFeedback,
    handleUpdateSignatures,
    handleUpdateCustomFields,
    handlePhotosChange // A função original do hook
  } = useServiceDetail();

  // --- FUNÇÃO DE DEPURAÇÃO ---
  // Esta nova função irá "embrulhar" a original e adicionar um log.
  // É isto que vamos passar para o PhotoUploader.
  const handlePhotosChangeWithDebug = (newPhotos: any[]) => {
    console.log('[DEBUG-SERVICE-DETAIL] O evento onPhotosChange foi recebido!');
    console.log('[DEBUG-SERVICE-DETAIL] A chamar a função handlePhotosChange do hook...');
    // Agora chamamos a função original que está no hook
    handlePhotosChange(newPhotos); 
  };
  // -------------------------

  const handleGenerateReport = async () => { /* ... (sem alterações) ... */ };

  if (isLoading) { /* ... (sem alterações) ... */ }
  if (!service) { /* ... (sem alterações) ... */ }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ServiceDetailHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div /* ... */ >
              <ServiceDetailCard service={service} onServiceUpdate={() => fetchService(service.id)} />
            </motion.div>
            {service.serviceType && (
              <motion.div /* ... */ >
                <TechnicalFieldsManager /* ... */ />
              </motion.div>
            )}
            <motion.div /* ... */ >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Fotos e Anexos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* --- A CORREÇÃO FINAL ESTÁ AQUI --- */}
                  <PhotoUploader
                    photos={photos}
                    onPhotosChange={handlePhotosChangeWithDebug} // Passamos a nossa nova função de depuração
                    maxPhotos={10}
                  />
                  {/* ------------------------------------- */}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div /* ... */ >
              <ServiceActions service={service} onStatusChange={handleStatusChange} editMode={editMode} />
            </motion.div>
          </div>
          <div className="space-y-6">
            <motion.div /* ... */ >
              <ServiceMessages /* ... */ />
            </motion.div>
            <motion.div /* ... */ >
              <ServiceFeedback /* ... */ />
            </motion.div>
            <motion.div /* ... */ >
              <ServiceSignatureSection /* ... */ />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceDetail;
export default ServiceDetail;
