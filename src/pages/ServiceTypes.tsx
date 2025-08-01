import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Clock,
  AlertCircle,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServiceTypes } from '@/hooks/useServiceTypes';
import { useToast } from '@/hooks/use-toast';
import { ServiceTypeForm } from '@/components/settings/ServiceTypeForm';
import { ServiceTypeList } from '@/components/settings/ServiceTypeList';
import { TechnicalFieldForm } from '@/components/settings/TechnicalFieldForm';
import { TechnicalFieldList } from '@/components/settings/TechnicalFieldList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ServiceTypes: React.FC = () => {
  const { serviceTypes, isLoading, refetchServiceTypes } = useServiceTypes();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);

  const handleServiceTypeCreated = () => {
    setIsCreateDialogOpen(false);
    refetchServiceTypes();
    toast({
      title: "Tipo de serviço criado!",
      description: "O novo tipo de serviço foi adicionado com sucesso.",
    });
  };

  const handleServiceTypeUpdated = () => {
    refetchServiceTypes();
    toast({
      title: "Tipo de serviço atualizado!",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleServiceTypeDeleted = () => {
    refetchServiceTypes();
    toast({
      title: "Tipo de serviço removido!",
      description: "O tipo de serviço foi deletado com sucesso.",
    });
  };

  const calculateStats = () => {
    const total = serviceTypes.length;
    const withFields = serviceTypes.filter(st => st.technicalFields && st.technicalFields.length > 0).length;
    const avgHours = serviceTypes.reduce((acc, st) => acc + (st.estimatedHours || 0), 0) / total || 0;
    
    return { total, withFields, avgHours: Math.round(avgHours * 10) / 10 };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando tipos de serviço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tipos de Serviço</h1>
            <p className="text-muted-foreground">
              Configure e gerencie os tipos de serviço disponíveis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-primary" />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Novo Tipo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Tipo de Serviço</DialogTitle>
                </DialogHeader>
                <ServiceTypeForm 
                  onSuccess={handleServiceTypeCreated}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tipos</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Com Campos Técnicos</p>
                  <p className="text-2xl font-bold text-green-500">{stats.withFields}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio (h)</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.avgHours}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="service-types" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="service-types" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Tipos de Serviço</span>
            </TabsTrigger>
            <TabsTrigger value="technical-fields" className="flex items-center space-x-2">
              <Wrench className="w-4 h-4" />
              <span>Campos Técnicos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="service-types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Lista de Tipos de Serviço</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceTypeList 
                  onServiceTypeUpdated={handleServiceTypeUpdated}
                  onServiceTypeDeleted={handleServiceTypeDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="technical-fields" className="space-y-4">
            {selectedServiceType ? (
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedServiceType(null)}
                  className="mb-4"
                >
                  ← Voltar para lista
                </Button>
                <Card>
                  <CardHeader>
                    <CardTitle>Campos Técnicos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TechnicalFieldForm serviceTypeId={selectedServiceType} />
                    <TechnicalFieldList serviceTypeId={selectedServiceType} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5" />
                    <span>Selecionar Tipo de Serviço</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Selecione um tipo de serviço para gerenciar seus campos técnicos:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceTypes.map((serviceType) => (
                      <Card 
                        key={serviceType.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedServiceType(serviceType.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{serviceType.name}</h3>
                            <Badge variant="outline">
                              {serviceType.technicalFields?.length || 0} campos
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {serviceType.description || 'Sem descrição'}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{serviceType.estimatedHours || 0}h</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{serviceType.defaultPriority || 'Média'}</span>
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default ServiceTypes;