
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/MockAuthContext';

interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export const useAuditLog = () => {
  const { user } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  
  const addLogEntry = (action: string, details: string) => {
    if (!user) return;
    
    const entry: AuditLogEntry = {
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date(),
      userId: user.id,
      userName: user.name
    };
    
    setAuditLog(prev => [entry, ...prev].slice(0, 100)); // Manter apenas os últimos 100 logs
    console.log('[AUDIT]', entry);
  };
  
  return {
    auditLog,
    addLogEntry
  };
};
