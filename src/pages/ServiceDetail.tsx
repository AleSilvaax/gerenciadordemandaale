// ARQUIVO COMPLETO E CORRIGIDO: src/pages/ServiceDetail.tsx

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import SectionCard from "@/components/service-detail/SectionCard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    if (service?.title || service?.number) {
      document.title = `Demanda ${service?.number ? `#${service.number}` : ''} | ${service?.title || 'Detalhes'}`;
    } else {
      document.title = 'Detalhes da Demanda';
    }
  }, [service?.title, service?.number]);

  const handleGenerateReport = async () => {
    if (!service || !user) {
      toast.error("Serviço ou dados do usuário não encontrados para gerar o relatório.");
      return;
    }

    try {
      toast.loading("Gerando relatório PDF...");
      const { generateProfessionalServiceReport } = await import("@/utils/pdf/professionalPdfGenerator");
      await generateProfessionalServiceReport(service);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório PDF. Verifique o console para mais detalhes.");
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
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" role="main">
      <motion.div
        className="container mx-auto p-4 md:p-6 pb-24 space-y-4 md:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <header>
          <ServiceDetailHeader title={service.title} number={service.number} />
        </header>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
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
              <SectionCard 
                title="Fotos e Anexos" 
                description="Documentação visual do atendimento"
                rightSlot={
                  photos.length > 0 ? (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                      <Camera className="w-3 h-3 mr-1" />
                      {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/30">
                      <Camera className="w-3 h-3 mr-1" />
                      Nenhuma foto
                    </Badge>
                  )
                }
              >
                <PhotoUploader
                  photos={photos}
                  onPhotosChange={handlePhotosChange}
                  serviceId={service.id}
                  maxPhotos={10}
                />
              </SectionCard>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <ServiceActions
                service={service}
                onStatusChange={handleStatusChange}
                editMode={editMode}
                onGenerateReport={handleGenerateReport}
              />
            </motion.div>
          </div>

          <aside className="space-y-4 lg:space-y-6 xl:sticky xl:top-4" aria-label="Interações da demanda">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
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
              transition={{ delay: 0.6 }}
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
              transition={{ delay: 0.7 }}
            >
              <ServiceSignatureSection
                service={service}
                onUpdateSignatures={handleUpdateSignatures}
              />
            </motion.div>
          </aside>
        </div>
      </motion.div>
    </main>
  );
};

export default ServiceDetail;
