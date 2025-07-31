// Arquivo: src/pages/Calendar.tsx (VERSÃO FINAL E CORRIGIDA)

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

// Componente do Calendário Visual Ultra Moderno
const ModernCalendar = ({ selectedDate, setSelectedDate, events }) => {
  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start, end });
  const startingDayIndex = getDay(start);

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'alta': return 'bg-red-500 shadow-red-500/30';
      case 'media': return 'bg-yellow-500 shadow-yellow-500/30';
      case 'baixa': return 'bg-green-500 shadow-green-500/30';
      case 'concluido': return 'bg-blue-500 shadow-blue-500/30';
      default: return 'bg-primary shadow-primary/30';
    }
  };

  const getDayEvents = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  return (
    <Card className="bg-gradient-to-br from-background/95 via-background/90 to-primary/5 backdrop-blur-xl border border-border/30 shadow-2xl overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold capitalize bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth} 
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:scale-110 transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth} 
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:scale-110 transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-7 gap-3 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-3 rounded-lg bg-muted/30">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} className="h-12" />)}
          {days.map(day => {
            const dayEvents = getDayEvents(day);
            const hasEvents = dayEvents.length > 0;
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-sm font-medium relative group overflow-hidden",
                  isToday && !isSelected && "bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold ring-2 ring-primary/40 shadow-lg",
                  isSelected && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl scale-110 ring-2 ring-primary/50",
                  !isSelected && !isToday && "hover:bg-gradient-to-br hover:from-accent/60 hover:to-accent/30 hover:scale-105 hover:shadow-md",
                  hasEvents && !isSelected && !isToday && "ring-1 ring-primary/30 bg-gradient-to-br from-primary/5 to-primary/10"
                )}
              >
                <span className="relative z-20">{format(day, 'd')}</span>
                {hasEvents && (
                  <div className="absolute bottom-1 flex gap-1 z-10">
                    {dayEvents.slice(0, 4).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-2 h-2 rounded-full shadow-lg",
                          getEventTypeColor(event.status || 'default')
                        )}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-lg" />
                    )}
                  </div>
                )}
                {/* Efeito de brilho para dias com eventos */}
                {hasEvents && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    calendarEvents,
    dayEvents,
    selectedDate,
    setSelectedDate,
    isLoading
  } = useCalendar();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <MobileHeader
        title="Calendário"
        subtitle="Agenda e cronogramas"
        rightAction={
          <Button size="sm" onClick={() => navigate("/nova-demanda")} className="gap-1">
            <Plus className="w-4 h-4" /> Nova
          </Button>
        }
      />

      <motion.div 
        className={`container mx-auto p-4 space-y-4 ${isMobile ? 'pt-2' : 'p-6 space-y-6'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!isMobile && (
          <motion.div 
            className="flex justify-between items-center"
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
            <Button onClick={() => navigate("/nova-demanda")} className="gap-2">
              <Plus className="w-4 h-4" /> Nova Demanda
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ModernCalendar 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
              events={calendarEvents} 
            />
          </motion.div>
          
          <motion.div
            className="lg:col-span-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-background/95 via-background/90 to-primary/5 backdrop-blur-xl border border-border/30 shadow-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/20">
                <CardTitle className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dayEvents.length > 0 ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                      {dayEvents.length === 0 ? 'Nenhum evento agendado' : `${dayEvents.length} evento${dayEvents.length > 1 ? 's' : ''} agendado${dayEvents.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {dayEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mx-auto mb-6 w-fit">
                      <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl shadow-inner">
                        <CalendarIcon className="w-12 h-12 text-muted-foreground/70" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">Dia livre na agenda</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                      Não há eventos agendados para este dia. Aproveite para criar uma nova demanda ou planejar suas atividades.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/nova-demanda")}
                      className="gap-2 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/30"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Demanda
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dayEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="group relative overflow-hidden"
                      >
                        <div 
                          className="p-5 bg-gradient-to-r from-background/80 via-background/60 to-background/40 rounded-2xl border border-border/40 cursor-pointer hover:border-primary/40 hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                          onClick={() => event.service?.id && navigate(`/demanda/${event.service.id}`)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-lg shadow-primary/30" />
                                <h4 className="font-bold text-lg group-hover:text-primary transition-colors duration-200">
                                  {event.title}
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {event.technician && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-medium">{event.technician.name}</span>
                                  </div>
                                )}
                                
                                {event.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                      <MapPin className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-medium">{event.location}</span>
                                  </div>
                                )}
                              </div>

                              {event.service && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                                  <span className="font-medium">OS #{event.service.number}</span>
                                  <span>•</span>
                                  <span>{event.service.client}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Horário</div>
                                <div className="font-semibold text-sm">
                                  {format(event.start, 'HH:mm', { locale: ptBR })}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                          </div>
                          
                          {/* Efeito de hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Calendar;
