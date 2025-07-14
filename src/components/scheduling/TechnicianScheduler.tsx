
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarDays, Plus, Clock, MapPin, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  service_id?: string;
  technician_id: string;
  status: string;
  created_at: string;
}

export const TechnicianScheduler: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    technician_id: user?.role === 'tecnico' ? user.id : ''
  });

  // Load technicians for admins/managers
  useEffect(() => {
    const loadTechnicians = async () => {
      if (user?.role === 'administrador' || user?.role === 'gestor') {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              id, name, avatar,
              user_roles!inner(role)
            `)
            .eq('user_roles.role', 'tecnico');

          if (error) throw error;
          setTechnicians(data || []);
        } catch (error) {
          console.error('Erro ao carregar técnicos:', error);
        }
      }
    };

    loadTechnicians();
  }, [user]);

  // Load events for selected date and technician
  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      try {
        const startDate = startOfDay(selectedDate);
        const endDate = endOfDay(selectedDate);
        
        let query = supabase
          .from('technician_schedule')
          .select('*')
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());

        // Filter by technician based on role
        if (user?.role === 'tecnico') {
          query = query.eq('technician_id', user.id);
        } else if (selectedTechnician) {
          query = query.eq('technician_id', selectedTechnician);
        }

        const { data, error } = await query.order('start_time');

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        toast.error('Erro ao carregar agenda');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate, selectedTechnician, user]);

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.start_time || !eventForm.end_time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const technicianId = user?.role === 'tecnico' ? user.id : eventForm.technician_id;
      
      if (!technicianId) {
        toast.error('Selecione um técnico');
        return;
      }

      const { error } = await supabase
        .from('technician_schedule')
        .insert({
          ...eventForm,
          technician_id: technicianId,
          status: 'agendado'
        });

      if (error) throw error;

      toast.success('Evento criado com sucesso!');
      setIsDialogOpen(false);
      setEventForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        technician_id: user?.role === 'tecnico' ? user.id : ''
      });

      // Reload events
      const startDate = startOfDay(selectedDate!);
      const endDate = endOfDay(selectedDate!);
      
      let query = supabase
        .from('technician_schedule')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (user?.role === 'tecnico') {
        query = query.eq('technician_id', user.id);
      } else if (selectedTechnician) {
        query = query.eq('technician_id', selectedTechnician);
      }

      const { data } = await query.order('start_time');
      setEvents(data || []);

    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Agenda de Técnicos
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  placeholder="Ex: Vistoria em equipamento"
                />
              </div>

              {(user?.role === 'administrador' || user?.role === 'gestor') && (
                <div>
                  <Label htmlFor="technician">Técnico *</Label>
                  <Select
                    value={eventForm.technician_id}
                    onValueChange={(value) => setEventForm({...eventForm, technician_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Hora Início *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({...eventForm, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Hora Fim *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({...eventForm, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  placeholder="Local do atendimento"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Detalhes do agendamento..."
                />
              </div>

              <Button onClick={handleCreateEvent} className="w-full">
                Criar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Agendamentos - {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </span>
              
              {(user?.role === 'administrador' || user?.role === 'gestor') && (
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos os técnicos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os técnicos</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento para este dia</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                      </span>
                      
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
