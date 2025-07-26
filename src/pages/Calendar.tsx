
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarView } from '@/components/calendar/CalendarView';
import { useAuth } from '@/context/AuthContext';
import { CalendarEvent } from '@/types/calendarTypes';

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleCreateEvent = () => {
    // TODO: Implementar modal de criação de evento
    console.log('Create event');
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // TODO: Implementar modal de detalhes/edição do evento
    console.log('Event clicked:', event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {user?.role === 'tecnico' ? 'Minha Agenda' : 'Calendário da Equipe'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {user?.role === 'tecnico' 
                ? 'Gerencie seus agendamentos e compromissos'
                : 'Visualize e gerencie os agendamentos da equipe'
              }
            </p>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CalendarView 
            onCreateEvent={handleCreateEvent}
            onEventClick={handleEventClick}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Calendar;
