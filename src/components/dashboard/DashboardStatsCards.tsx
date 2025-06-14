
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  // Staggered motion variants
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
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
          color={stat.color}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </motion.div>
  );
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 80, damping: 15 } }
};

const CountUpCard: React.FC<Stat> = ({ label, value, color, icon, description }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    // Animate value up using a basic timestamp loop
    let raf: number;
    let start: number = 0;
    let lastFrameValue = 0;
    const duration = 1.1; // seconds
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

  return (
    <motion.div
      className="z-0"
      variants={cardVariants}
      whileHover={{
        scale: 1.045,
        boxShadow: "0 8px 28px 0 rgba(57,123,255,0.14)", // sombra azulada sutil
        transition: { type: "spring", stiffness: 130, damping: 18 }
      }}
    >
      <Card
        className={cn(
          "overflow-hidden border-2 border-white/10 bg-gradient-to-t from-card to-background/90 shadow-xl transition-all duration-300",
          "hover:border-primary/60 hover:bg-card/90",
          "rounded-xl"
        )}
      >
        <CardContent className="py-6 px-6">
          <div className="flex items-center gap-3 justify-between mb-1">
            <div>
              <div className={cn(
                "text-[2.15rem] font-bold leading-tight transition-colors duration-200",
                color || "text-primary"
              )}>
                {displayValue}
              </div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
            {icon && (
              <motion.div
                whileHover={{ scale: 1.09 }}
                className="p-3 rounded-xl bg-white/10 shadow-inner mix-blend-luminosity"
              >
                {icon}
              </motion.div>
            )}
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
