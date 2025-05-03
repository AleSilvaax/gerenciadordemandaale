
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
import { PhotoUploader } from '@/components/ui-custom/PhotoUploader';
import { DeadlineManager } from '@/components/ui-custom/DeadlineManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomField, TeamMember, ServicePriority, ServiceStatus } from '@/types/serviceTypes';
import { useAuth } from '@/context/AuthContext';
import { getCurrentTeam } from '@/services/teamService';
import { createService } from '@/services/api';

const NewService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<ServicePriority>('media');
  const [status, setStatus] = useState<ServiceStatus>('pendente');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [currentTeam, setCurrentTeam] = useState<{ id: string; name: string } | null>(null);
  const isMobile = useIsMobile();
  
  // Buscar informações da equipe atual do usuário
  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const teamData = await getCurrentTeam();
        if (teamData) {
          console.log("Equipe encontrada:", teamData);
          setCurrentTeam({
            id: teamData.id,
            name: teamData.name
          });
        } else {
          console.log("Nenhuma equipe encontrada para o usuário");
        }
      } catch (error) {
        console.error("Erro ao buscar informações da equipe:", error);
      }
    };

    fetchTeamInfo();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!currentTeam) {
      toast.error('Você precisa estar vinculado a uma equipe para criar demandas.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create default technician object since it's required by the type
      const defaultTechnician: TeamMember = {
        id: user?.id || '0',
        name: user?.name || 'Não atribuído',
        avatar: user?.avatar || '',
        role: user?.role || 'tecnico',
      };
      
      console.log('Preparing to create service...');
      
      const newService = {
        title,
        description,
        location,
        priority,
        status,
        technician: defaultTechnician,
        customFields,
        photos,
        dueDate: deadline ? deadline.toISOString() : undefined,
        messages: [],
        team_id: currentTeam.id
      };
      
      console.log('Submitting service:', newService);
      
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

  // Função para lidar com erros no formulário e fornecer feedback ao usuário
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
      
      {!currentTeam ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <h2 className="text-xl font-semibold mb-2">Nenhuma equipe encontrada</h2>
              <p className="mb-4 text-muted-foreground">
                Você precisa estar vinculado a uma equipe para criar demandas.
              </p>
              <Button onClick={() => navigate('/gerenciar-equipe')}>
                Gerenciar Equipe
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="team">Equipe</Label>
                <Input
                  id="team"
                  value={currentTeam.name}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Esta demanda será associada à sua equipe atual
                </p>
              </div>
              
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      )}
    </div>
  );
};

export default NewService;
