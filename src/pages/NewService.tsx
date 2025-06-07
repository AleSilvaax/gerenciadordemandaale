
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CustomFieldManager } from '@/components/ui-custom/CustomFieldManager';
import { DeadlineManager } from '@/components/ui-custom/DeadlineManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomField, TeamMember, ServicePriority, ServiceStatus, ServiceType } from '@/types/serviceTypes';
import { useAuth } from '@/context/AuthContext';
import { createService } from '@/services/api';
import { getServiceTypes } from '@/services/serviceTypesService';
import { getCurrentTeam } from '@/services/teamService';

const NewService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<ServicePriority>('media');
  const [status, setStatus] = useState<ServiceStatus>('pendente');
  const [serviceType, setServiceType] = useState<string>('');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const isMobile = useIsMobile();

  // Carregar equipe atual do usuário
  useEffect(() => {
    const loadCurrentTeam = async () => {
      try {
        setLoadingTeam(true);
        const team = await getCurrentTeam();
        setCurrentTeam(team);
        console.log('Equipe atual do usuário:', team);
      } catch (error) {
        console.error('Erro ao carregar equipe atual:', error);
      } finally {
        setLoadingTeam(false);
      }
    };

    if (user) {
      loadCurrentTeam();
    }
  }, [user]);

  // Carregar tipos de serviço ao montar o componente
  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        setLoadingServiceTypes(true);
        const types = await getServiceTypes();
        setServiceTypes(types);
        console.log('Tipos de serviço carregados:', types);
      } catch (error) {
        console.error('Erro ao carregar tipos de serviço:', error);
        toast.error('Erro ao carregar tipos de serviço');
      } finally {
        setLoadingServiceTypes(false);
      }
    };

    loadServiceTypes();
  }, []);

  // Atualizar campos quando o tipo de serviço for selecionado
  useEffect(() => {
    if (serviceType) {
      const selectedType = serviceTypes.find(type => type.id === serviceType);
      if (selectedType) {
        console.log('Tipo de serviço selecionado:', selectedType);
        setEstimatedHours(selectedType.estimatedHours || 0);
        if (selectedType.defaultPriority) {
          setPriority(selectedType.defaultPriority);
        }
      }
    }
  }, [serviceType, serviceTypes]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log('Preparando para criar demanda...');
      console.log('Equipe atual:', currentTeam);
      
      // Criar demanda com dados simplificados
      const newService = {
        title,
        description: description || '',
        location,
        priority,
        status,
        technician: {
          id: user?.id || '0',
          name: user?.name || 'Não atribuído',
          avatar: user?.avatar || '',
          role: user?.role || 'tecnico',
        } as TeamMember,
        customFields: customFields || [],
        photos: photos || [],
        dueDate: deadline ? deadline.toISOString() : undefined,
        messages: [],
        serviceType: serviceType || undefined,
        estimatedHours: estimatedHours || 0,
        creationDate: new Date().toISOString()
      };
      
      console.log('Submetendo demanda:', newService);
      
      const result = await createService(newService);
      if (result) {
        toast.success('Demanda criada com sucesso!');
        navigate('/demandas');
      } else {
        throw new Error('Falha ao criar demanda - nenhum dado retornado do servidor');
      }
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      toast.error('Erro ao criar demanda. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para validar o formulário
  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Por favor, insira um título para a demanda.');
      return false;
    }
    
    if (!location.trim()) {
      toast.error('Por favor, insira uma localização para a demanda.');
      return false;
    }
    
    return true;
  };

  return (
    <div className="container mx-auto p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6">Nova Demanda</h1>
      
      {/* Exibir informação sobre a equipe */}
      {!loadingTeam && (
        <Card className="mb-6">
          <CardContent className="p-4">
            {currentTeam ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>✅ Conectado à equipe:</span>
                <span className="font-medium text-foreground">{currentTeam.name}</span>
              </div>
            ) : (
              <div className="text-sm text-amber-600">
                ⚠️ Você não está vinculado a nenhuma equipe. A demanda será criada sem vinculação de equipe.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Manutenção do ar-condicionado"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
              {loadingServiceTypes ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando tipos de serviço...</span>
                </div>
              ) : (
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Selecione o tipo de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {serviceType && (
                <div className="text-sm text-muted-foreground">
                  {serviceTypes.find(t => t.id === serviceType)?.description}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Sede Principal - 3º Andar"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema ou serviço necessário..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(value: ServicePriority) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: ServiceStatus) => setStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <DeadlineManager value={deadline} onChange={setDeadline} />
        
        <CustomFieldManager 
          fields={customFields} 
          onChange={setCustomFields}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 text-muted-foreground">
              Adicione fotos à sua demanda na página de detalhes após criar.
            </div>
          </CardContent>
        </Card>
        
        <div className={`fixed ${isMobile ? 'bottom-24' : 'bottom-16'} left-0 right-0 pt-4 pb-4 bg-background flex justify-end gap-2 z-30 px-4 md:px-8 border-t shadow-md`}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/demandas')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Demanda'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewService;
