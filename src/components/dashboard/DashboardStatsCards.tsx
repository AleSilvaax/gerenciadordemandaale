
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface Stat {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}

interface DashboardStatsCardsProps {
  stats: Stat[];
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <CountUpCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          color={stat.color}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};

const CountUpCard: React.FC<Stat> = ({ label, value, color, icon }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    // Animate value up using a basic timestamp loop
    let raf: number;
    let start: number = 0;
    let lastFrameValue = 0;
    const frame = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / 1000, 1);
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
      whileHover={{ scale: 1.035, boxShadow: "0 8px 28px rgba(52, 144, 220, 0.08)" }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
    >
      <Card className="overflow-hidden transition-all shadow-md hover:shadow-xl border border-white/10">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-3 justify-between">
            <div>
              <div className={`text-2xl font-bold ${color}`}>{displayValue}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            {icon && <div className="p-2 rounded-full bg-white/10">{icon}</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
