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

// Componente do Calendário Visual Moderno
const ModernCalendar = ({ selectedDate, setSelectedDate, events }) => {
  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start, end });
  const startingDayIndex = getDay(start);

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-primary';
    }
  };

  const getDayEvents = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/30 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold capitalize bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} className="h-10" />)}
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
                  "h-10 rounded-lg flex flex-col items-center justify-center transition-all duration-200 text-sm relative group",
                  isToday && !isSelected && "bg-primary/20 text-primary font-semibold ring-1 ring-primary/30",
                  isSelected && "bg-primary text-primary-foreground shadow-lg scale-105",
                  !isSelected && !isToday && "hover:bg-accent/50 hover:scale-105",
                  hasEvents && !isSelected && "ring-1 ring-primary/20"
                )}
              >
                <span className="relative z-10">{format(day, 'd')}</span>
                {hasEvents && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          getEventTypeColor(event.status || 'default')
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground opacity-50" />
                    )}
                  </div>
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
            <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/30 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {dayEvents.length === 0 ? 'Nenhum evento' : `${dayEvents.length} evento(s)`}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto mb-4">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">Nenhum evento agendado</p>
                    <p className="text-sm text-muted-foreground">Que tal criar uma nova demanda?</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group p-4 bg-gradient-to-r from-background/60 to-background/40 rounded-xl border border-border/30 cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                        onClick={() => event.service?.id && navigate(`/demanda/${event.service.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                              {event.title}
                            </h4>
                            {event.technician && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <User className="w-3 h-3" />
                                {event.technician.name}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
