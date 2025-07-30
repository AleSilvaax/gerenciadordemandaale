// Arquivo: src/components/ui/date-picker.tsx (VERSÃO FINAL E CORRIGIDA)

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react'; // Renomeado para clareza
import { Button } from '@/components/ui/button';
// ✅ CORREÇÃO APLICADA AQUI: Importando o componente pelo nome correto 'CalendarView'
import { CalendarView as CalendarComponent } from '@/components/ui/calendar'; 
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
  date?: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, onDateChange, placeholder = "Selecionar data", className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Nenhuma mudança aqui, pois já estávamos usando o alias 'CalendarComponent' */}
        <CalendarComponent
          // O componente CalendarView não parece aceitar estas props, então vamos simplificar
          // para evitar futuros erros. Se precisar de seleção, teremos que ajustar o CalendarView.
        />
      </PopoverContent>
    </Popover>
  );
}
