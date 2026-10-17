
import React from "react";
import { StatCard } from "@/components/ui-custom/StatCard";
import { TrendingUp, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardStatsCards: React.FC = () => {
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
          value="15"
          icon={<TrendingUp className="h-5 w-5" />}
          description="Demandas registradas no período"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard tone="emerald"
          title="CONCLUÍDAS"
          value="1"
          icon={<CheckCircle className="h-5 w-5" />}
          description="7% de taxa de conclusão"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard tone="amber"
          title="PENDENTES"
          value="14"
          icon={<Clock className="h-5 w-5" />}
          description="Aguardando execução"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard tone="rose"
          title="ATRASADAS"
          value="0"
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Passaram do prazo"
        />
      </motion.div>
    </motion.div>
  );
};
