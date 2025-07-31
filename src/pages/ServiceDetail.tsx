// ARQUIVO COMPLETO E CORRIGIDO: src/pages/ServiceDetail.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
// import { generateProfessionalServiceReport } from "@/utils/pdf/professionalReportGenerator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceDetailHeader } from "@/components/service-detail/ServiceDetailHeader";
import { ServiceDetailCard } from "@/components/service-detail/ServiceDetailCard";
import { ServiceActions } from "@/components/service-detail/ServiceActions";
import { ServiceMessages } from "@/components/service-detail/ServiceMessages";
import { ServiceFeedback } from "@/components/service-detail/ServiceFeedback";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // IMPORTADO PARA PEGAR O USUÁRIO

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const { user } = useAuth(); // ADICIONADO PARA PEGAR O USUÁRIO LOGADO
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

  // FUNÇÃO DESABILITADA TEMPORARIAMENTE
  const handleGenerateReport = async () => {
    if (!service || !user) {
      toast.error("Serviço ou dados do usuário não encontrados para gerar o relatório.");
      return;
    }

    try {
      const { generateModernServiceReport } = await import("@/utils/pdf/modernPdfReportGenerator");
      await generateModernServiceReport(service);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando demanda...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Demanda não encontrada</h2>
          <p className="text-muted-foreground mb-4">A demanda solicitada não existe ou foi removida.</p>
          <Link to="/demandas">
            <Button>Voltar às Demandas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        className="container mx-auto p-4 md:p-6 pb-24 space-y-4 md:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ServiceDetailHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ServiceDetailCard service={service} onServiceUpdate={() => fetchService(service.id)} />
            </motion.div>

            {service.serviceType && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <TechnicalFieldsManager
                  serviceType={service.serviceType}
                  currentFields={service.customFields || []}
                  onFieldsUpdate={handleUpdateCustomFields}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Camera className="w-4 h-4 md:w-5 md:h-5" />
                    Fotos e Anexos
                    {photos.length > 0 && (
                      <span className="text-sm text-muted-foreground">({photos.length} fotos)</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PhotoUploader
                    photos={photos}
                    onPhotosChange={handlePhotosChange}
                    serviceId={service.id}
                    maxPhotos={10}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Botão único para gerar relatório */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardContent className="p-4">
                  <Button
                    onClick={handleGenerateReport}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Relatório PDF
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ServiceActions
                service={service}
                onStatusChange={handleStatusChange}
                editMode={editMode}
              />
            </motion.div>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <ServiceMessages
                service={service}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <ServiceFeedback
                service={service}
                feedback={feedback}
                setFeedback={setFeedback}
                onSubmitFeedback={handleSubmitFeedback}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <ServiceSignatureSection
                service={service}
                onUpdateSignatures={handleUpdateSignatures}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceDetail;
