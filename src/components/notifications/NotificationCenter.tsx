import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/uiStore";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, removeNotification } =
    useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Deduplica notificações disparadas no mesmo evento para a mesma demanda
  const uniqueNotifications = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const seen = new Map<string, number>();

    return sorted.filter((n) => {
      const cleanMessage = (n.message || "")
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .trim();
      const key = n.serviceId
        ? `srv-${n.serviceId}`
        : `msg-${cleanMessage.slice(0, 30)}`;
      const time = new Date(n.timestamp).getTime();
      const lastTime = seen.get(key);

      // Se houve outra notificação da mesma demanda nos últimos 15 segundos, oculta a duplicata
      if (lastTime && Math.abs(lastTime - time) < 15000) {
        return false;
      }
      seen.set(key, time);
      return true;
    });
  }, [notifications]);

  const unreadCount = uniqueNotifications.filter((n) => !n.read).length;

  const handleNotificationClick = (
    notificationId: string,
    serviceId?: string,
    route?: string
  ) => {
    notifications.forEach((n) => {
      if (n.id === notificationId || (serviceId && n.serviceId === serviceId)) {
        markNotificationRead(n.id);
      }
    });
    if (route) {
      navigate(route);
    } else if (serviceId) {
      navigate(`/demanda/${serviceId}`);
    }
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const clearAll = () => {
    notifications.forEach((n) => removeNotification(n.id));
  };

  const cleanText = (text: string) => {
    // Remove emojis soltos no início do título
    return text.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, "");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case "error":
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-xl border border-slate-200 shadow-lg bg-white dark:bg-slate-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Notificações
            </span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0"
              >
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Ler todas
              </Button>
            )}
          </div>
        </div>

        {/* Lista */}
        {uniqueNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nenhuma notificação
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Você está em dia com todas as demandas.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {uniqueNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.serviceId,
                      notification.route
                    )
                  }
                  className={cn(
                    "group relative flex items-start gap-3 p-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    !notification.read && "bg-blue-50/30 dark:bg-blue-950/20"
                  )}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {cleanText(notification.title)}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-0.5">
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Rodapé */}
        {uniqueNotifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40">
            <span className="text-[11px] text-slate-500">
              {uniqueNotifications.length} notificaç
              {uniqueNotifications.length !== 1 ? "ões" : "ão"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar tudo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
