
import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import ServiceTabContainer from "./components/ServiceTabContainer";
import ServiceStatusBadge from "./components/ServiceStatusBadge";
import { ServiceDetailProvider, useServiceDetail } from "./context/ServiceDetailContext";

const ServiceContent = () => {
  const { service, isLoading } = useServiceDetail();
  const { id } = useParams<{ id: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando dados da demanda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/demandas" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {id ? `Demanda #${id}` : "Nova Demanda"}
          </h1>
          {service?.status && (
            <ServiceStatusBadge status={service.status} />
          )}
        </div>
      </div>

      <ServiceTabContainer />
    </div>
  );
};

const ServiceDetailPage = () => {
  return (
    <ServiceDetailProvider>
      <ServiceContent />
    </ServiceDetailProvider>
  );
};

export default ServiceDetailPage;
