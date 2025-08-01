import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Settings, 
  Wrench,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServiceTypes } from '@/hooks/useServiceTypes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ServiceTypes: React.FC = () => {
  const { serviceTypes, isLoading } = useServiceTypes();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const calculateStats = () => {
    const total = serviceTypes.length;
    const withFields = 0; // Temporário até ter campos técnicos
    const avgHours = 0; // Temporário até ter estimativas
    
    return { total, withFields, avgHours };
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
    <div className="space-y-6 p-6">
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
                <div className="p-4">
                  <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="mt-4"
                  >
                    Fechar
                  </Button>
                </div>
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

      {/* Lista de Tipos de Serviço */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Tipos de Serviço Disponíveis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum tipo de serviço encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map((serviceType) => (
                  <Card key={serviceType.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{serviceType.name}</h3>
                        <Badge variant="outline">
                          0 campos
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {serviceType.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>0h</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Settings className="w-3 h-3" />
                          <span>Média</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ServiceTypes;