
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Novo: mapa de cor de fundo clássico de dashboard que segue padrão para cada label de insight.
// Você pode adicionar mais labels/cores facilmente!
const cardBgColors: Record<string, string> = {
  "Total de Demandas": "bg-blue-500",
  "Concluídas": "bg-green-500",
  "Pendentes": "bg-yellow-500",
  "Atrasadas": "bg-red-500",
};

interface Stat {
  label: string;
  value: number;
  color?: string; // Cor do texto, não mais usada, fundo definirá estilo
  icon?: React.ReactNode;
  description?: string;
}

interface DashboardStatsCardsProps {
  stats: Stat[];
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats }) => {
  // Animação de container: staggered (bem visível).
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.13,
      },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
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
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 80, damping: 15 }
  }
};

interface CountUpCardProps extends Stat {
  index?: number;
}

const CountUpCard: React.FC<CountUpCardProps> = ({ label, value, icon, description, index }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    // Animação "count up"
    let raf: number;
    let start: number = 0;
    let lastFrameValue = 0;
    const duration = 1.15; // seconds
    const frame = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const currentValue = Math.floor(progress * value);
      if (currentValue !== lastFrameValue) {
        setDisplayValue(currentValue);
        lastFrameValue = currentValue;
      }
      if (progress < 1) raf = requestAnimationFrame(frame);
      else setDisplayValue(value);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  // Definindo cor de fundo baseada no label. Default fallback: azul.
  const bgClass = cardBgColors[label] || "bg-blue-500";
  const textClass = "text-white"; // texto branco para contraste

  // Micro efeito de "pulse" na borda quando hover, para mais visibilidade.
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
        filter: "brightness(1.08)",
        transition: { type: "spring", stiffness: 130, damping: 18 }
      }}
    >
      <Card
        className={cn(
          // Visual colorido estilo dashboard clássico (fundo colorido, texto branco, sombra forte).
          "overflow-hidden border-0 shadow-lg rounded-xl px-0 py-0 transition-all duration-300",
          bgClass,
          "relative"
        )}
      >
        <CardContent className={cn(
          "py-7 px-7 flex flex-col h-full min-h-[124px] justify-between",
        )}>
          <div className="flex items-center gap-3 justify-between mb-1">
            <div>
              <div className={cn(
                "text-[2.65rem] font-extrabold tracking-tight leading-tight drop-shadow-sm transition-colors duration-200 mb-1",
                textClass
              )}>
                {displayValue}
              </div>
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                textClass,
                "opacity-90"
              )}>{label}</p>
            </div>
            {icon && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full shadow-inner border-white/20 border-2 bg-white/20 mix-blend-luminosity",
                  "transition-all duration-200"
                )}
              >
                {icon}
              </motion.div>
            )}
          </div>
          {!!description && (
            <div className="pt-2">
              <span className={cn("text-xs opacity-90", textClass)}>{description}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
