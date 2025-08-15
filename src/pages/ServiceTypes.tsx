import React from "react";
import { TechnicalSettingsTab } from "@/components/settings/TechnicalSettingsTab";
import { ServiceTypeMaterialsManager } from "@/components/service-detail/ServiceTypeMaterialsManager";

const ServiceTypes: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Tipos de Serviço
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure e gerencie os tipos de serviços e campos técnicos
            </p>
          </div>
        </div>

        {/* Use the complete Technical Settings component */}
        <TechnicalSettingsTab />
      </div>
    </div>
  );
};

export default ServiceTypes;