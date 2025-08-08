
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export const ServiceDetailHeader: React.FC<{ title?: string; number?: string | number; }> = ({ title, number }) => {
  return (
    <motion.div 
      className="flex items-center gap-4 mb-8"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <Link 
        to="/demandas" 
        className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
      </Link>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {number ? `Demanda #${number}` : 'Detalhes da Demanda'}{title ? ` — ${title}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">Visualize e gerencie os detalhes da demanda</p>
      </div>
    </motion.div>
  );
};
