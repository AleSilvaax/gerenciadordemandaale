
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/MockAuthContext';

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  userId: string;
  userName: string;
  user_id: string;
  user_name: string;
  resource_type: string;
  resource_id?: string;
  created_at: string;
}

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ASSIGN: 'ASSIGN',
  EXPORT: 'EXPORT'
} as const;

export const RESOURCE_TYPES = {
  SERVICE: 'service',
  USER: 'user',
  TEAM: 'team',
  AUTH: 'auth'
} as const;

export const useAuditLog = () => {
  const { user } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const addLogEntry = (action: string, details: string) => {
    if (!user) return;
    
    const entry: AuditLogEntry = {
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date(),
      userId: user.id,
      userName: user.name,
      user_id: user.id,
      user_name: user.name,
      resource_type: 'general',
      created_at: new Date().toISOString()
    };
    
    setAuditLog(prev => [entry, ...prev].slice(0, 100));
    console.log('[AUDIT]', entry);
  };

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ) => {
    if (!user) return;
    
    const entry: AuditLogEntry = {
      id: Date.now().toString(),
      action,
      details: JSON.stringify({ oldValues, newValues, metadata }),
      timestamp: new Date(),
      userId: user.id,
      userName: user.name,
      user_id: user.id,
      user_name: user.name,
      resource_type: resourceType,
      resource_id: resourceId,
      created_at: new Date().toISOString()
    };
    
    setAuditLog(prev => [entry, ...prev].slice(0, 100));
    console.log('[AUDIT]', entry);
  };

  const getLogs = async () => {
    setIsLoading(true);
    // In a real implementation, this would fetch from the database
    setIsLoading(false);
  };
  
  return {
    auditLog,
    logs: auditLog,
    isLoading,
    addLogEntry,
    logAction,
    getLogs
  };
};
