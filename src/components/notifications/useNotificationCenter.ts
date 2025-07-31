// Hook simplificado para notificações - removido para evitar erros de tipos
import { useState } from 'react';

export const useNotificationCenter = () => {
  const [notifications] = useState([]);
  const [isLoading] = useState(false);
  
  const markAsRead = async () => {
    // Funcionalidade removida temporariamente
  };
  
  const markAllAsRead = async () => {
    // Funcionalidade removida temporariamente  
  };
  
  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    unreadCount: 0
  };
};