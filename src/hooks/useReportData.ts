
import { useState, useEffect } from "react";
import { getServices } from "@/services/servicesDataService";

interface ReportData {
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  cancelledServices: number;
}

/**
 * Hook para carregar e processar dados de relatórios estatísticos
 */
export function useReportData(period: string, technician: string, serviceType: string) {
  const [reportData, setReportData] = useState<ReportData>({
    totalServices: 0,
    completedServices: 0,
    pendingServices: 0,
    cancelledServices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const services = await getServices();
        
        // Calculate statistics based on filters
        const filteredServices = services.filter(service => {
          // Apply period filter (simplified)
          const serviceDate = new Date(service.creationDate || service.date || '');
          const now = new Date();
          const periodDays = parseInt(period);
          const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
          
          const withinPeriod = serviceDate >= cutoffDate;
          const matchesTechnician = technician === 'all' || service.technician?.name === technician;
          const matchesServiceType = serviceType === 'all' || service.serviceType === serviceType;
          
          return withinPeriod && matchesTechnician && matchesServiceType;
        });

        const stats = {
          totalServices: filteredServices.length,
          completedServices: filteredServices.filter(s => s.status === 'concluido').length,
          pendingServices: filteredServices.filter(s => s.status === 'pendente').length,
          cancelledServices: filteredServices.filter(s => s.status === 'cancelado').length
        };

        setReportData(stats);
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [period, technician, serviceType]);

  return { reportData, loading };
}
