
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    calendarEvents,
    selectedDate,
    setSelectedDate,
    getDayEvents,
    isLoading
  } = useCalendar();

  const todayEvents = getDayEvents(new Date());
  const selectedDayEvents = getDayEvents(selectedDate);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header */}
      <MobileHeader
        title="Calendário"
        subtitle="Agenda e cronogramas"
        rightAction={
          <Button
            size="sm"
            onClick={() => navigate("/nova-demanda")}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        }
      />

      <motion.div 
        className={`container mx-auto p-4 space-y-4 ${isMobile ? 'pt-2' : 'p-6 space-y-6'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <motion.div 
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Calendário
              </h1>
              <p className="text-muted-foreground mt-2">
                Visualize e gerencie seus agendamentos e prazos
              </p>
            </div>
            
            <Button 
              onClick={() => navigate("/nova-demanda")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Demanda
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events for Today */}
          <motion.div
            className="lg:col-span-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Eventos de Hoje
                  <span className="text-sm text-muted-foreground">
                    ({todayEvents.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum evento hoje</p>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/nova-demanda')}
                      className="mt-4"
                    >
                      Criar Nova Demanda
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-background/30 rounded-lg border border-border/30 cursor-pointer hover:bg-background/50 transition-colors"
                        onClick={() => navigate(`/demanda/${event.service?.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-xs text-muted-foreground mt-1">
                                📍 {event.location}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              event.status === 'concluido' 
                                ? 'bg-green-100 text-green-700'
                                : event.status === 'cancelado'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Calendar Summary */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{calendarEvents.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Eventos</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pendentes</span>
                    <span className="text-sm font-medium">
                      {calendarEvents.filter(e => e.status === 'pendente').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Concluídos</span>
                    <span className="text-sm font-medium text-green-600">
                      {calendarEvents.filter(e => e.status === 'concluido').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cancelados</span>
                    <span className="text-sm font-medium text-red-600">
                      {calendarEvents.filter(e => e.status === 'cancelado').length}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/demandas')}
                    className="w-full"
                  >
                    Ver Todas as Demandas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Calendar;
