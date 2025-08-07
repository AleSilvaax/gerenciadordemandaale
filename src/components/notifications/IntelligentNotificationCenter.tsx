import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  BellRing, 
  X, 
  Filter, 
  Settings,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  Wrench,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useUIStore, Notification } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type NotificationWithActions = Notification;

export const IntelligentNotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, removeNotification } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [autoMarkAsRead, setAutoMarkAsRead] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const navigate = useNavigate();

  // Transform notifications to include enhanced data
  const enhancedNotifications: NotificationWithActions[] = notifications.map(notif => ({
    ...notif,
    category: notif.serviceId ? 'service' : 'system',
    priority: notif.type === 'error' ? 'critical' : 
              notif.type === 'warning' ? 'high' : 
              notif.type === 'success' ? 'medium' : 'low',
    actions: notif.serviceId ? [{
      label: 'Ver Demanda',
      action: () => {
        navigate(`/demanda/${notif.serviceId}`);
        if (autoMarkAsRead) markNotificationRead(notif.id);
        setIsOpen(false);
      }
    }] : []
  }));

  const unreadCount = enhancedNotifications.filter(n => !n.read).length;
  const criticalCount = enhancedNotifications.filter(n => n.priority === 'critical' && !n.read).length;

  // Filter notifications
  const filteredNotifications = enhancedNotifications.filter(notif => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notif.read;
    if (filterType === 'critical') return notif.priority === 'critical';
    return notif.type === filterType;
  });

  // Group notifications by category if enabled
  const groupedNotifications = groupByCategory 
    ? filteredNotifications.reduce((groups, notif) => {
        const category = notif.category || 'system';
        if (!groups[category]) groups[category] = [];
        groups[category].push(notif);
        return groups;
      }, {} as Record<string, NotificationWithActions[]>)
    : { all: filteredNotifications };

  const getNotificationIcon = (type: string, priority?: string) => {
    if (priority === 'critical') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'service': return <Wrench className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      case 'assignment': return <User className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'service': return 'Demandas';
      case 'deadline': return 'Prazos';
      case 'assignment': return 'Atribuições';
      default: return 'Sistema';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/15 text-red-700 border-red-500/30';
      case 'high': return 'bg-orange-500/15 text-orange-700 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
      default: return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
    }
  };

  const markAllAsRead = () => {
    enhancedNotifications
      .filter(n => !n.read)
      .forEach(n => markNotificationRead(n.id));
  };

  const clearAllNotifications = () => {
    enhancedNotifications.forEach(n => removeNotification(n.id));
  };

  const handleNotificationClick = (notification: NotificationWithActions) => {
    if (!notification.read && autoMarkAsRead) {
      markNotificationRead(notification.id);
    }
    
    if (notification.serviceId) {
      navigate(`/demanda/${notification.serviceId}`);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-primary/10"
        >
          <motion.div
            animate={criticalCount > 0 ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.5, repeat: criticalCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          >
            {criticalCount > 0 ? (
              <BellRing className="w-5 h-5 text-red-500" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </motion.div>
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="destructive" 
                className={`h-5 min-w-[20px] text-xs flex items-center justify-center rounded-full ${
                  criticalCount > 0 ? 'animate-pulse bg-red-600' : ''
                }`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-96 p-0 bg-background/95 backdrop-blur-lg border-border/50" 
        align="end"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {criticalCount} críticas
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Popover open={showSettings} onOpenChange={setShowSettings}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium">Configurações</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Marcar como lida automaticamente</label>
                          <Switch 
                            checked={autoMarkAsRead} 
                            onCheckedChange={setAutoMarkAsRead} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Agrupar por categoria</label>
                          <Switch 
                            checked={groupByCategory} 
                            onCheckedChange={setGroupByCategory} 
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar todas como lidas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={clearAllNotifications} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar todas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Filtros */}
            <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
              <TabsList className="grid grid-cols-5 w-full h-8">
                <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Não lidas</TabsTrigger>
                <TabsTrigger value="critical" className="text-xs">Críticas</TabsTrigger>
                <TabsTrigger value="warning" className="text-xs">Avisos</TabsTrigger>
                <TabsTrigger value="success" className="text-xs">Sucesso</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {Object.keys(groupedNotifications).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
                    <div key={category} className="space-y-2">
                      {groupByCategory && categoryNotifications.length > 0 && (
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          {getCategoryIcon(category)}
                          {getCategoryLabel(category)}
                          <Badge variant="outline" className="text-xs">
                            {categoryNotifications.length}
                          </Badge>
                        </div>
                      )}
                      
                      <AnimatePresence>
                        {categoryNotifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                              notification.read 
                                ? 'bg-muted/30 border-border/50 hover:bg-muted/50' 
                                : 'bg-background border-primary/20 hover:bg-primary/5 ring-1 ring-primary/10'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(notification.type, notification.priority)}
                              </div>
                              
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`text-sm font-medium line-clamp-1 ${
                                    notification.read ? 'text-muted-foreground' : 'text-foreground'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {notification.priority && notification.priority !== 'low' && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}
                                      >
                                        {notification.priority}
                                      </Badge>
                                    )}
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markNotificationRead(notification.id);
                                          }}
                                        >
                                          {notification.read ? (
                                            <>
                                              <EyeOff className="w-4 h-4 mr-2" />
                                              Marcar como não lida
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="w-4 h-4 mr-2" />
                                              Marcar como lida
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeNotification(notification.id);
                                          }}
                                          className="text-red-600"
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          Remover
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                
                                <p className={`text-xs line-clamp-2 ${
                                  notification.read ? 'text-muted-foreground/80' : 'text-muted-foreground'
                                }`}>
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground/60">
                                    {format(notification.timestamp, "dd/MM 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                  
                                  {notification.actions && notification.actions.length > 0 && (
                                    <div className="flex gap-1">
                                      {notification.actions.map((action, actionIndex) => (
                                        <Button
                                          key={actionIndex}
                                          size="sm"
                                          variant={action.variant || "outline"}
                                          className="h-6 text-xs px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            action.action();
                                          }}
                                        >
                                          {action.label}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {category !== 'all' && groupByCategory && (
                        <Separator className="my-3" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {enhancedNotifications.length > 0 && (
              <div className="p-4 border-t border-border/50 bg-muted/20">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{enhancedNotifications.length} notificações no total</span>
                  <span>{unreadCount} não lidas</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};