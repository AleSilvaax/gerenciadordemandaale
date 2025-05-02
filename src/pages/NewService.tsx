
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createService } from '@/services/servicesDataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import CustomFieldManager from '@/components/ui-custom/CustomFieldManager';
import PhotoUploader from '@/components/ui-custom/PhotoUploader';
import DeadlineManager from '@/components/ui-custom/DeadlineManager';
import { useIsMobile } from '@/hooks/use-mobile';

const NewService: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('media');
  const [status, setStatus] = useState('pendente');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const isMobile = useIsMobile();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Por favor, insira um título para a demanda.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newService = {
        title,
        description,
        priority,
        status,
        custom_fields: customFields,
        photos,
        deadline: deadline ? deadline.toISOString() : null,
      };
      
      const result = await createService(newService);
      if (result) {
        toast.success('Demanda criada com sucesso!');
        navigate('/demandas');
      }
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      toast.error('Erro ao criar demanda. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6">Nova Demanda</h1>
      
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
                <Select value={priority} onValueChange={setPriority}>
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
                <Select value={status} onValueChange={setStatus}>
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
          setFields={setCustomFields}
        />
        
        <PhotoUploader 
          photos={photos} 
          setPhotos={setPhotos}
        />
        
        <div className={`sticky ${isMobile ? 'bottom-24' : 'bottom-16'} pt-4 pb-4 bg-background flex justify-end gap-2 z-10`}>
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
