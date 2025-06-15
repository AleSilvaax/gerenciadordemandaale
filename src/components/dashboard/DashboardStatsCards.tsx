
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          title="TOTAL DE DEMANDAS"
          value="15"
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          description="Demandas registradas no período"
          className="card-enhanced border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="CONCLUÍDAS"
          value="1"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          description="7% de taxa de conclusão"
          className="card-enhanced border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="PENDENTES"
          value="14"
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          description="Aguardando execução"
          className="card-enhanced border-l-4 border-l-yellow-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="ATRASADAS"
          value="0"
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          description="Passaram do prazo"
          className="card-enhanced border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300"
        />
      </motion.div>
    </motion.div>
  );
};
