import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/ui-custom/StatCard";
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { getServices } from "@/services/servicesDataService";

interface StatsData {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export const RealTimeStatsCards: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const services = await getServices();
        
        const completed = services.filter(s => s.status === 'concluido').length;
        const pending = services.filter(s => s.status === 'pendente').length;
        const canceled = services.filter(s => s.status === 'cancelado').length;
        
        // Calculate overdue services (pending services with dueDate in the past)
        const now = new Date();
        const overdue = services.filter(s => {
          if (s.status !== 'pendente') return false;
          const dueDate = new Date(s.dueDate || s.creationDate);
          return dueDate < now;
        }).length;

        const total = services.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({
          total,
          completed,
          pending,
          overdue,
          completionRate
        });
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <StatCard tone="blue"
          title="TOTAL DE DEMANDAS"
          value={stats.total.toString()}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Demandas registradas no sistema"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard tone="emerald"
          title="CONCLUÍDAS"
          value={stats.completed.toString()}
          icon={<CheckCircle className="h-5 w-5" />}
          description={`${stats.completionRate}% de taxa de conclusão`}
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard tone="amber"
          title="PENDENTES"
          value={stats.pending.toString()}
          icon={<Clock className="h-5 w-5" />}
          description="Aguardando execução"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard tone="rose"
          title="ATRASADAS"
          value={stats.overdue.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Passaram do prazo"
        />
      </motion.div>
    </motion.div>
  );
};
