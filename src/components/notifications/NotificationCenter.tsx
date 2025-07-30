// Arquivo: src/components/NotificationCenter.tsx (VERSÃO FINAL E CORRIGIDA)

import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationCenter } from '@/hooks/useNotificationCenter'; // ✅ 1. Conectado ao "cérebro" correto
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationCenter: React.FC = () => {
  // ✅ 2. Usando os dados do nosso novo hook
  const { notifications, unreadCount, markAsRead } = useNotificationCenter();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Marca todas as notificações não lidas como lidas quando o menu é aberto
    if (open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      markAsRead(unreadIds);
    }
  };

  const handleNotificationClick = (notificationId: string, serviceId?: string) => {
    markAsRead(notificationId);
    if (serviceId) {
      navigate(`/demanda/${serviceId}`);
    }
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    if (allIds.length > 0) {
      markAsRead(allIds);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
              >
                {unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium text-sm">Notificações</h4>
          {notifications.length > 0 && (
             <Button variant="link" className="text-xs h-auto p-0" onClick={markAllAsRead}>
                <CheckCheck className="w-3 h-3 mr-1"/>
                Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-8">
              Nenhuma notificação por aqui.
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.serviceId)}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b last:border-b-0 hover:bg-accent cursor-pointer",
                    !notification.isRead && "bg-primary/10"
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className={cn(
                        "h-2 w-2 rounded-full mt-1.5",
                        notification.isRead ? "bg-transparent" : "bg-primary"
                    )} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
