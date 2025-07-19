// Arquivo: src/pages/ServiceDetail.tsx (Com a correção de sanitização)

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getService, updateService } from "@/services/api";
import { ServiceDetailHeader } from "@/components/service-detail/ServiceDetailHeader";
import { ServiceDetailCard } from "@/components/service-detail/ServiceDetailCard";
import { ServiceActions } from "@/components/service-detail/ServiceActions";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Service } from "@/types/serviceTypes";
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetService = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const serviceData = await getService(id);
        if (!serviceData) {
          toast.error("Demanda não encontrada.");
          navigate("/demandas");
        } else {
          setService(serviceData);
          console.log("[DEBUG] ServiceDetail - Service data após fetch:", serviceData); // Adicionado para depuração
        }
      } catch (error) {
        console.error("Erro ao carregar os detalhes da demanda:", error);
        toast.error("Falha ao carregar a demanda.");
        navigate("/demandas");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndSetService();
  }, [id, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner text="Carregando demanda..." /></div>;
  }

  if (!service) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">Demanda não encontrada</h2>
          <p className="text-muted-foreground mt-2">A demanda que você procura não existe ou foi movida.</p>
          <Button asChild className="mt-4"><Link to="/demandas">Voltar para a lista</Link></Button>
        </div>
      </div>
    );
  }

  // SANITIZAÇÃO ROBUSTA
  const safeTechnician =
    !service.technician || (Array.isArray(service.technician) && service.technician.length === 0)
      ? { id: '0', name: 'Não atribuído', avatar: '' }
      : Array.isArray(service.technician)
        ? service.technician[0]
        : service.technician;

  const safeService = {
    ...service,
    technician: safeTechnician,
    feedback: service.feedback || { 
      rating: 0, 
      comment: '', 
      wouldRecommend: false,
      clientRating: 0, // Adicionado campo obrigatório
      clientComment: '', // Adicionado campo opcional com valor padrão
      technicianFeedback: '', // Adicionado campo opcional com valor padrão
      userId: '', // Adicionado campo opcional com valor padrão
      userName: '', // Adicionado campo opcional com valor padrão
      timestamp: '', // Adicionado campo opcional com valor padrão
    },
    photos: Array.isArray(service.photos) ? service.photos : [],
    customFields: Array.isArray(service.customFields) ? service.customFields : [],
    signatures: service.signatures || { client: '', technician: '' }
  };

  const handleStatusChange = async (status: Service['status']) => {
    try {
      const updatedService = await updateService({ id: safeService.id, status });
      setService(updatedService);
      toast.success("Status da demanda atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar o status.");
    }
  };

  const handleGenerateReport = async (service: Service) => {
    try {
      const { generateProfessionalServiceReport } = await import('@/utils/pdf/professionalReportGenerator');
      await generateProfessionalServiceReport(service);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar o relatório PDF. Tente novamente.");
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <motion.div
          className="container mx-auto p-4 md:p-6 pb-24 space-y-4 md:space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ServiceDetailHeader />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Agora passamos o objeto "seguro" para os componentes filhos */}
              <ServiceDetailCard service={safeService} onServiceUpdate={() => getService(safeService.id).then(setService)} />
              <ServiceActions 
                service={safeService} 
                onStatusChange={handleStatusChange}
                onGenerateReport={() => handleGenerateReport(safeService)}
              />
              {/* Restante dos componentes que usam 'safeService' */}
            </div>
            <div className="space-y-6">
              {/* Componentes da coluna da direita */}
            </div>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default ServiceDetail;
