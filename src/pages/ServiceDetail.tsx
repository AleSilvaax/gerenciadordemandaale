// Arquivo: src/pages/ServiceDetail.tsx

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

// --- MUDANÇA IMPORTANTE ---
// Trocamos a importação para usar a versão otimizada da função
import { getService, updateService, addServiceMessage } from "@/services/api"; 
// -------------------------

import { ServiceDetailHeader } from "@/components/service-detail/ServiceDetailHeader";
import { ServiceDetailCard } from "@/components/service-detail/ServiceDetailCard";
import { ServiceActions } from "@/components/service-detail/ServiceActions";
import { ServiceMessages } from "@/components/service-detail/ServiceMessages";
import { ServiceFeedback } from "@/components/service-detail/ServiceFeedback";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { Service } from "@/types/serviceTypes";
import { Download } from "lucide-react";

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  const fetchService = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      console.log('[ServiceDetail-CORRIGIDO] Buscando serviço com ID:', id);
      const serviceData = await getService(id);

      if (!serviceData) {
        console.warn('[ServiceDetail-CORRIGIDO] Serviço não encontrado, redirecionando.');
        toast.error("Demanda não encontrada.");
        navigate("/demandas");
        return;
      }

      console.log('[ServiceDetail-CORRIGIDO] Dados recebidos:', serviceData);
      setService(serviceData);
    } catch (error) {
      console.error('[ServiceDetail-CORRIGIDO] Erro ao buscar serviço:', error);
      toast.error("Erro ao carregar os detalhes da demanda.");
      navigate("/demandas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [id, navigate]);

  const handleServiceUpdate = async (updates: Partial<Service>) => {
    if (!service) return;
    try {
      const updatedService = await updateService({ id: service.id, ...updates });
      setService(updatedService);
      toast.success("Demanda atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar a demanda.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner text="Carregando detalhes da demanda..." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">Demanda não encontrada</h2>
          <p className="text-muted-foreground mt-2">
            A demanda que você está procurando não existe ou foi movida.
          </p>
          <Button asChild className="mt-4">
            <Link to="/demandas">Voltar para a lista</Link>
          </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ServiceDetailCard service={service} onServiceUpdate={fetchService} />
            <ServiceActions service={service} onStatusChange={(status) => handleServiceUpdate({ status })} />
            <Button onClick={() => {}} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Gerar Relatório PDF
            </Button>
          </div>
          <div className="space-y-6">
            {/* Outros componentes como Chat, Feedback, etc. podem ser adicionados aqui */}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceDetail;
