import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIntelligentAnalytics, AnalyticsInsight } from '@/hooks/useIntelligentAnalytics';
import { useToast } from '@/hooks/use-toast';

interface NotificationItem extends AnalyticsInsight {
  id: string;
  timestamp: Date;
  read: boolean;
}

export const IntelligentNotificationSystem: React.FC = () => {
  const { insights } = useIntelligentAnalytics();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Converter insights em notificações
  useEffect(() => {
    const newNotifications = insights.map(insight => ({
      ...insight,
      id: `${insight.type}-${insight.title}-${Date.now()}`,
      timestamp: new Date(),
      read: false
    }));

    // Verificar se há novos insights importantes
    const criticalInsights = newNotifications.filter(n => 
      n.type === 'danger' || (n.type === 'warning' && n.title.includes('Sobrecarga'))
    );

    if (criticalInsights.length > 0) {
      criticalInsights.forEach(insight => {
        toast({
          title: insight.title,
          description: insight.description,
          variant: insight.type === 'danger' ? 'destructive' : 'default',
        });
      });
    }

    setNotifications(prev => {
      // Evitar duplicatas baseadas no título
      const existingTitles = prev.map(n => n.title);
      const uniqueNew = newNotifications.filter(n => !existingTitles.includes(n.title));
      return [...uniqueNew, ...prev].slice(0, 10); // Manter apenas as 10 mais recentes
    });
  }, [insights, toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500 border-green-200';
      case 'warning': return 'text-yellow-500 border-yellow-200';
      case 'danger': return 'text-red-500 border-red-200';
      case 'info': return 'text-blue-500 border-blue-200';
      default: return 'text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de Notificações */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50"
          >
            <Card className="shadow-lg border">
              <div className="p-4 border-b bg-muted/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Insights Inteligentes</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={markAllAsRead}
                      >
                        Marcar todas
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma notificação no momento</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => {
                      const Icon = getIcon(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-3 border-l-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-muted/30' : ''
                          } ${getColorClass(notification.type)}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getColorClass(notification.type).split(' ')[0]}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium truncate">
                                  {notification.title}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {notification.description}
                              </p>
                              <div className="flex items-center justify-between">
                                {notification.value && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.value}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {notification.timestamp.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para fechar */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};