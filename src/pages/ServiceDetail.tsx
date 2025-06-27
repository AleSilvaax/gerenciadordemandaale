
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import { generateDetailedServiceReport } from "@/utils/detailedReportGenerator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera } from "lucide-react";

// Import new components
import { ServiceDetailHeader } from "@/components/service-detail/ServiceDetailHeader";
import { ServiceDetailCard } from "@/components/service-detail/ServiceDetailCard";
import { ServiceActions } from "@/components/service-detail/ServiceActions";
import { ServiceMessages } from "@/components/service-detail/ServiceMessages";
import { ServiceFeedback } from "@/components/service-detail/ServiceFeedback";
import { useServiceDetail } from "@/hooks/useServiceDetail";

interface ServiceDetailProps {
  editMode?: boolean;
}
// No ficheiro: src/pages/ServiceDetail.tsx

// ... (todas as importações no topo)

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  
  // --- ADICIONE ESTA LINHA ---
  console.log('[TESTE DE ATUALIZAÇÃO] O ficheiro ServiceDetail.tsx foi recarregado.');
  // -------------------------

  const {
    service,
    isLoading,
    // ... (resto do seu código)
  } = useServiceDetail();

  // ... (resto do ficheiro)

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
    handlePhotosChange
  } = useServiceDetail();

  const handleGenerateReport = async () => {
    if (!service) return;
    
    try {
      console.log("Gerando relatório PDF para serviço:", service.id);
      await generateDetailedServiceReport(service);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4">Serviço não encontrado</h2>
          <button 
            onClick={() => navigate("/demandas")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Voltar às Demandas
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <ServiceDetailHeader />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ServiceDetailCard 
                service={service} 
                onServiceUpdate={() => fetchService(service.id)} 
              />
            </motion.div>

            {/* Technical Fields Checklist */}
            {service.serviceType && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <TechnicalFieldsManager
                  serviceType={service.serviceType}
                  currentFields={service.customFields || []}
                  onFieldsUpdate={handleUpdateCustomFields}
                  disabled={editMode}
                />
              </motion.div>
            )}

            {/* Photos Section with PhotoUploader */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Fotos e Anexos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PhotoUploader
                    photos={photos}
                    onPhotosChange={handlePhotosChange}
                    maxPhotos={10}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ServiceActions 
                service={service}
                onStatusChange={handleStatusChange}
                editMode={editMode}
              />
            </motion.div>
          </div>

          {/* Right Column - Messages and Feedback */}
          <div className="space-y-6">
            {/* Messages Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ServiceMessages
                service={service}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
              />
            </motion.div>

            {/* Feedback Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <ServiceFeedback
                service={service}
                feedback={feedback}
                setFeedback={setFeedback}
                onSubmitFeedback={handleSubmitFeedback}
              />
            </motion.div>

            {/* Signatures and Report Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ServiceSignatureSection
                service={service}
                onUpdateSignatures={handleUpdateSignatures}
                onGenerateReport={handleGenerateReport}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceDetail;
