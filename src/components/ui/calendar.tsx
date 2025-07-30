// Arquivo: src/pages/Calendar.tsx (VERSÃO FINAL COM IMPORTAÇÃO CORRIGIDA)

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile'; // ✅ LINHA CORRIGIDA
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

// Componente do Calendário Visual Interativo
const InteractiveCalendar = ({ selectedDate, setSelectedDate, events }) => {
  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start, end });
  const startingDayIndex = getDay(start);

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const dayHasEvent = events.some(event => isSameDay(event.start, day));
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors text-sm relative",
                  isSameDay(day, new Date()) && "bg-muted text-foreground",
                  isSameDay(day, selectedDate) && "bg-primary text-primary-foreground",
                  !isSameDay(day, selectedDate) && "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {format(day, 'd')}
                {dayHasEvent && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
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
            <InteractiveCalendar 
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
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Eventos para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  <span className="text-sm text-muted-foreground">({dayEvents.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum evento para este dia</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-background/30 rounded-lg border border-border/30 cursor-pointer hover:bg-background/50 transition-colors"
                        onClick={() => event.service?.id && navigate(`/demanda/${event.service.id}`)}
                      >
                        <h4 className="font-medium">{event.title}</h4>
                        {event.technician && (
                           <p className="text-xs text-muted-foreground mt-1">
                             Técnico: {event.technician.name}
                           </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
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
