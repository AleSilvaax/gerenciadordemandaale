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
        
        // Calculate overdue services (pending services with dueDate in the past)
        const now = new Date();
        const overdue = services.filter(s => {
          if (s.status !== 'pendente') return false;
          if (!s.dueDate && !s.creationDate) return false;
          const dueDate = new Date(s.dueDate || s.creationDate!);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border/50 p-6 animate-pulse">
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          title="TOTAL DE DEMANDAS"
          value={stats.total.toString()}
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          description="Demandas registradas no sistema"
          className="card-enhanced border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="CONCLUÍDAS"
          value={stats.completed.toString()}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          description={`${stats.completionRate}% de taxa de conclusão`}
          className="card-enhanced border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="PENDENTES"
          value={stats.pending.toString()}
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          description="Aguardando execução"
          className="card-enhanced border-l-4 border-l-yellow-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="ATRASADAS"
          value={stats.overdue.toString()}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          description="Passaram do prazo"
          className="card-enhanced border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
    </motion.div>
  );
};
