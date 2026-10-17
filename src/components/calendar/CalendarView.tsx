import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  ChevronRight as ArrowIcon,
} from "lucide-react";
import { useCalendar } from "@/hooks/useCalendar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "@/types/calendarTypes";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarViewProps {
  onCreateEvent?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onCreateEvent,
  onEventClick,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { calendarEvents, selectedDate, setSelectedDate, isLoading } =
    useCalendar();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Quantidade de células vazias antes do dia 1 para alinhar o dia da semana corretamente
  const startWeekdayOffset = getDay(monthStart);

  const getEventsForDay = (date: Date) => {
    return (calendarEvents || []).filter((event) =>
      isSameDay(new Date(event.start), date)
    );
  };

  const formatShortOS = (num?: string | number) => {
    if (!num) return "";
    const parts = String(num).split("-");
    return `OS #${parts[parts.length - 1].replace("#", "")}`;
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "em_andamento":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelado":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-emerald-500";
      case "em_andamento":
        return "bg-blue-500";
      case "cancelado":
        return "bg-rose-500";
      default:
        return "bg-amber-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "agendado":
        return "Agendado";
      case "em_andamento":
        return "Em Andamento";
      case "concluido":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(
      currentMonth.getMonth() + (direction === "prev" ? -1 : 1)
    );
    setCurrentMonth(newMonth);
  };

  const handleEventSelect = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else if (event.service?.id || event.id) {
      navigate(`/demanda/${event.service?.id || event.id}`);
    }
  };

  const handleNewDemand = () => {
    if (onCreateEvent) {
      onCreateEvent();
    } else {
      navigate("/nova-demanda");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Agenda Operacional
          </h1>
          <p className="text-xs text-slate-500">
            Cronograma de vistorias, instalações e manutenções
          </p>
        </div>

        {user && (
          <Button
            onClick={handleNewDemand}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 rounded-lg shadow-2xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova OS
          </Button>
        )}
      </div>

      {/* Grade do Calendário */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold capitalize text-slate-900 dark:text-white">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 rounded-lg border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 rounded-lg border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dias alinhados com o dia da semana correto */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekdayOffset }).map((_, emptyIdx) => (
              <div key={`empty-${emptyIdx}`} className="h-11 sm:h-14" />
            ))}

            {monthDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-11 sm:h-14 rounded-xl text-xs font-medium transition-all",
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : isTodayDate
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span>{format(day, "d")}</span>

                  {dayEvents.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isSelected
                              ? "bg-white"
                              : getStatusDotColor(ev.status)
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos do Dia Selecionado */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
              {format(selectedDate, "dd")}
            </div>
            <div>
              <CardTitle className="text-sm font-bold capitalize text-slate-900 dark:text-white">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                {selectedDayEvents.length === 0
                  ? "Nenhum agendamento"
                  : `${selectedDayEvents.length} atendimento${
                      selectedDayEvents.length !== 1 ? "s" : ""
                    } programado${selectedDayEvents.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2.5">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Dia livre na agenda
              </p>
              <p className="text-xs text-slate-500 mt-0.5 mb-4 max-w-xs">
                Não há ordens de serviço agendadas para esta data.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNewDemand}
                className="h-8 text-xs border-slate-200"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agendar Demanda
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((event) => {
                const shortOS = formatShortOS(event.service?.number);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {shortOS && (
                          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {shortOS}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0 font-medium",
                            getStatusBadgeStyle(event.status)
                          )}
                        >
                          {getStatusLabel(event.status)}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {event.technician && (
                          <span className="inline-flex items-center gap-1 capitalize">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {event.technician}
                          </span>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {event.location}
                          </span>
                        )}
                        {event.service?.client && (
                          <span className="truncate text-slate-400">
                            • {event.service.client}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                          Horário
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          {format(new Date(event.start), "HH:mm")}
                        </span>
                      </div>
                      <ArrowIcon className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
