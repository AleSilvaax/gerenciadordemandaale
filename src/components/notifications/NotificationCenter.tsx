// Sistema de Notificações Inteligente e Moderno

import React, { useState } from 'react';
import { Bell, CheckCheck, X, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, removeNotification, isConnected } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleNotificationClick = (notificationId: string, serviceId?: string, route?: string) => {
    markNotificationRead(notificationId);
    if (route) {
      navigate(route);
    } else if (serviceId) {
      navigate(`/demanda/${serviceId}`);
    }
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
    });
  };

  const removeNotificationHandler = (notificationId: string) => {
    removeNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'outline';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 shadow-xl border-border/50" align="end">
        {/* Header Moderno */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Notificações</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-border'}`} />
              <span>{isConnected ? 'Online' : 'Offline'}</span>
            </div>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-auto p-1" onClick={markAllAsRead}>
                <CheckCheck className="w-3 h-3 mr-1"/>
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-muted-foreground p-12"
            >
              <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto mb-4">
                <Bell className="h-8 w-8 opacity-50" />
              </div>
              <h3 className="font-medium mb-2">Nenhuma notificação</h3>
              <p className="text-xs">Você está em dia com tudo!</p>
            </motion.div>
          ) : (
            <div className="divide-y divide-border/30">
              <AnimatePresence>
                {notifications
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group relative flex items-start gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-all duration-200",
                      !notification.read && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.serviceId, notification.route)}
                  >
                    {/* Ícone da notificação */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="font-medium text-sm mb-1 line-clamp-1">{notification.title}</h5>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                            <Badge 
                              variant={getNotificationBadgeVariant(notification.type)} 
                              className="text-xs px-1.5 py-0.5"
                            >
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Botão de remover */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotificationHandler(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Indicador de não lida */}
                    {!notification.read && (
                      <div className="absolute top-4 left-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer com ações */}
        {notifications.length > 0 && (
          <div className="p-3 bg-muted/30 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{notifications.length} notificaç{notifications.length !== 1 ? 'ões' : 'ão'} total</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-auto p-1"
                onClick={() => {
                  notifications.forEach(n => removeNotification(n.id));
                }}
              >
                Limpar todas
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
