
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { useAuditedServices } from "@/hooks/useAuditedServices";
import { Search } from "lucide-react";

export default function MinhasDemandas() {
  const { services, isLoading } = useAuditedServices();
  const [searchTerm, setSearchTerm] = useState("");

  // For now, show all services. In the future, filter by current user
  const userServices = services;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando suas demandas...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Minhas Demandas</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Demandas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, localização ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {userServices.length > 0 ? (
          userServices
            .filter(service =>
              service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
              service.client?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Você ainda não possui demandas atribuídas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
