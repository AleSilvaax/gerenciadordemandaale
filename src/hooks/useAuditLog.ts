
import { useState, useEffect } from 'react';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

interface AuditLogOptions {
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

export const useAuditLog = () => {
  const { user } = useEnhancedAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const logEntry: AuditLogEntry = {
        id: crypto.randomUUID(),
        user_id: user.id,
        user_name: user.name,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        metadata,
        timestamp: new Date().toISOString(),
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      };

      // Store in localStorage for immediate access
      const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const updatedLogs = [logEntry, ...existingLogs].slice(0, 1000); // Keep last 1000 entries
      localStorage.setItem('audit_logs', JSON.stringify(updatedLogs));

      console.log(`[AUDIT] ${action} on ${resourceType}:${resourceId} by ${user.name}`);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const getLogs = async (options: AuditLogOptions = {}) => {
    setIsLoading(true);
    try {
      // Get from localStorage
      const localLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]') as AuditLogEntry[];
      let filteredLogs = localLogs;

      if (options.resourceType) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.resource_type === options.resourceType
        );
      }
      if (options.resourceId) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.resource_id === options.resourceId
        );
      }
      if (options.userId) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.user_id === options.userId
        );
      }
      if (options.limit) {
        filteredLogs = filteredLogs.slice(0, options.limit);
      }

      setLogs(filteredLogs);
      return filteredLogs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    localStorage.removeItem('audit_logs');
    setLogs([]);
  };

  return {
    logs,
    isLoading,
    logAction,
    getLogs,
    clearLogs
  };
};

// Helper function to get client IP
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// Pre-defined action types for consistency
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  ASSIGN: 'assign',
  UNASSIGN: 'unassign',
  APPROVE: 'approve',
  REJECT: 'reject',
  COMPLETE: 'complete',
  CANCEL: 'cancel'
} as const;

export const RESOURCE_TYPES = {
  SERVICE: 'service',
  USER: 'user',
  TEAM: 'team',
  REPORT: 'report',
  SETTINGS: 'settings',
  AUTH: 'auth'
} as const;
