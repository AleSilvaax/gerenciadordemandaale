
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const cardAccentColors: Record<string, string> = {
  "Total de Demandas": "bg-blue-500",
  "Concluídas": "bg-green-500",
  "Pendentes": "bg-yellow-500",
  "Atrasadas": "bg-red-500",
};

interface Stat {
  label: string;
  value: number;
  color?: string; // Legacy, não usado aqui
  icon?: React.ReactNode;
  description?: string;
}

interface DashboardStatsCardsProps {
  stats: Stat[];
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats }) => {
  // Animação de container: stagger.
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

  // Definindo cor de detalhe baseada no label
  const accentClass = cardAccentColors[label] || "bg-blue-500";
  const iconColor = cardAccentColors[label]?.replace("bg-", "text-") || "text-blue-500";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        scale: 1.03,
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.14)"
      }}
    >
      <Card className={cn(
        "overflow-hidden border border-border shadow-sm rounded-xl px-0 py-0 transition-all duration-300 bg-card relative"
      )}>
        {/* Barra lateral colorida */}
        <div className={cn(
          "absolute left-0 top-0 h-full w-1 rounded-s-xl",
          accentClass
        )} />
        <CardContent className={cn(
          "py-7 px-7 flex flex-col h-full min-h-[104px] justify-between"
        )}>
          <div className="flex items-center gap-3 justify-between mb-0">
            <div>
              <div className={cn(
                "text-3xl md:text-4xl font-extrabold tracking-tight leading-none transition-colors duration-200 text-foreground"
              )}>
                {displayValue}
              </div>
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide mt-1 text-muted-foreground"
              )}>{label}</p>
            </div>
            {/* Opcional: pode usar o ícone colorido, atualmente não utilizado */}
            {/* {icon && (
              <div className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full bg-muted/40",
                iconColor
              )}>
                {icon}
              </div>
            )} */}
          </div>
          {!!description && (
            <div className="pt-2">
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

