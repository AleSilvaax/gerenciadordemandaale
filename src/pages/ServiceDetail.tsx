import React, { useEffect } from "react";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import SectionCard from "@/components/service-detail/SectionCard";
import { toast } from "sonner";
import { Camera, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ServiceDetailHeader } from "@/components/service-detail/ServiceDetailHeader";
import { ServiceDetailCard } from "@/components/service-detail/ServiceDetailCard";
import { ServiceActions } from "@/components/service-detail/ServiceActions";
import { ServiceMessages } from "@/components/service-detail/ServiceMessages";
import { ServiceFeedback } from "@/components/service-detail/ServiceFeedback";
import { ServiceMaterialsManager } from "@/components/service-detail/ServiceMaterialsManager";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const { user } = useAuth();
  const {
    service,
    isLoading,
    newMessage,
    setNewMessage,
    feedback,
    setFeedback,
    photos,
    fetchService,
    handleStatusChange,
    handleSendMessage,
    handleSubmitFeedback,
    handleUpdateSignatures,
    handleUpdateCustomFields,
    handlePhotosChange,
  } = useServiceDetail();

  useEffect(() => {
    if (service?.title || service?.number) {
      const shortNum = service.number
        ? String(service.number).split("-").pop()?.replace("#", "")
        : "";
      document.title = `OS ${shortNum ? `#${shortNum}` : ""} — ${
        service.title || "Detalhes"
      } | ServiceFlow`;
    } else {
      document.title = "Detalhes da Demanda | ServiceFlow";
    }
  }, [service?.title, service?.number]);

  const handleGenerateReport = async () => {
    if (!service || !user) {
      toast.error(
        "Dados da demanda ou do usuário não encontrados para gerar o relatório."
      );
      return;
    }

    const toastId = toast.loading("Gerando relatório técnico em PDF...");
    try {
      const { generateProfessionalServiceReport } = await import(
        "@/utils/pdf/professionalPdfGenerator"
      );
      await generateProfessionalServiceReport({
        ...service,
        photos: photos && photos.length > 0 ? photos : service.photos || [],
      });
      toast.success("Relatório PDF gerado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Não foi possível gerar o relatório PDF.", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Demanda não encontrada
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm">
          A ordem de serviço solicitada não existe ou foi removida do sistema.
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to="/demandas">Voltar às Demandas</Link>
        </Button>
      </div>
    );
  }

  const isServiceConcluded = service.status === "concluido";

  return (
    <div className="space-y-5">
      <ServiceDetailHeader title={service.title} number={service.number} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Coluna Principal */}
        <div className="xl:col-span-2 space-y-5">
          <ServiceDetailCard
            service={service}
            onServiceUpdate={() => fetchService(service.id)}
          />

          {service.serviceType && (
            <TechnicalFieldsManager
              serviceType={service.serviceType}
              currentFields={service.customFields || []}
              onFieldsUpdate={handleUpdateCustomFields}
            />
          )}

          <SectionCard
            title="Fotos e Anexos"
            description={
              isServiceConcluded
                ? "Registo fotográfico consolidado (somente leitura)"
                : "Adicione fotos do atendimento em campo"
            }
            rightSlot={
              <Badge
                variant="outline"
                className={
                  photos.length > 0
                    ? "bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium"
                    : "bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium"
                }
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {photos.length} {photos.length === 1 ? "foto" : "fotos"}
              </Badge>
            }
          >
            <PhotoUploader
              photos={photos}
              onPhotosChange={handlePhotosChange}
              serviceId={service.id}
              maxPhotos={10}
              disabled={isServiceConcluded}
            />
          </SectionCard>

          <ServiceMaterialsManager
            serviceId={service.id}
            isReadOnly={isServiceConcluded}
          />

          <ServiceActions
            service={service}
            onStatusChange={handleStatusChange}
            editMode={editMode}
            onGenerateReport={handleGenerateReport}
          />
        </div>

        {/* Coluna Lateral */}
        <aside
          className="space-y-5 xl:sticky xl:top-20 self-start"
          aria-label="Interações e validação da demanda"
        >
          <ServiceMessages
            service={service}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={handleSendMessage}
          />

          <ServiceFeedback
            service={service}
            feedback={feedback}
            setFeedback={setFeedback}
            onSubmitFeedback={handleSubmitFeedback}
          />

          <ServiceSignatureSection
            service={service}
            onUpdateSignatures={handleUpdateSignatures}
          />
        </aside>
      </div>
    </div>
  );
};

export default ServiceDetail;
