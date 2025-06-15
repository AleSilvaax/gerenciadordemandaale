
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

const cardGradients: Record<string, string> = {
  "Total de Demandas": "from-blue-500 to-cyan-600",
  "Concluídas": "from-green-500 to-emerald-600", 
  "Pendentes": "from-yellow-500 to-orange-600",
  "Atrasadas": "from-red-500 to-pink-600",
};

interface Stat {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
  description?: string;
}

interface DashboardStatsCardsProps {
  stats: Stat[];
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats }) => {
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat, i) => (
        <CountUpCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
          index={i}
        />
      ))}
    </motion.div>
  );
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      type: 'spring' as const, 
      stiffness: 100, 
      damping: 15,
      duration: 0.6
    }
  }
};

interface CountUpCardProps extends Stat {
  index?: number;
}

const CountUpCard: React.FC<CountUpCardProps> = ({ label, value, icon, description, index }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const { theme } = useTheme();

  React.useEffect(() => {
    let raf: number;
    let start: number = 0;
    let lastFrameValue = 0;
    const duration = 1.5;
    
    const frame = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOut * value);
      
      if (currentValue !== lastFrameValue) {
        setDisplayValue(currentValue);
        lastFrameValue = currentValue;
      }
      
      if (progress < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setDisplayValue(value);
      }
    };
    
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const gradientClass = cardGradients[label] || "from-slate-500 to-slate-600";
  
  // Theme-aware card styling
  const cardBaseClass = theme === 'light'
    ? "bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl"
    : "bg-slate-800/90 border-slate-700/50 shadow-xl hover:shadow-2xl";

  const gradientOpacity = theme === 'light' ? "opacity-10 group-hover:opacity-15" : "opacity-5 group-hover:opacity-10";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        scale: 1.05,
        y: -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <Card className={cn(
        "relative overflow-hidden backdrop-blur-sm",
        cardBaseClass,
        "transition-all duration-300 group-hover:border-white/40"
      )}>
        {/* Gradiente de fundo animado */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
          gradientClass,
          gradientOpacity
        )} />
        
        {/* Barra lateral gradiente */}
        <div className={cn(
          "absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b transition-all duration-300 group-hover:w-2",
          gradientClass
        )} />
        
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Valor principal */}
              <motion.div 
                className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: index ? index * 0.1 : 0, duration: 0.5, type: "spring" }}
              >
                {displayValue}
              </motion.div>
              
              {/* Label */}
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                {label}
              </p>
              
              {/* Descrição */}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {description}
                </p>
              )}
            </div>
            
            {/* Ícone */}
            {icon && (
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg text-white",
                  gradientClass
                )}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: (index ? index * 0.1 : 0) + 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {icon}
              </motion.div>
            )}
          </div>
          
          {/* Efeito de brilho no hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000",
            theme === 'light' ? "via-white/10" : "via-white/5"
          )} />
        </CardContent>
      </Card>
    </motion.div>
  );
};
