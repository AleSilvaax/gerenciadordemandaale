
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface AnimatedPieChartProps {
  data: PieData[];
  height?: number;
}

export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({ data, height = 220 }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Efeito de fill animado das fatias
  const radiusStep = 16;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          startAngle={90}
          endAngle={-270}
          paddingAngle={2}
          dataKey="value"
          label
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          onMouseLeave={() => setActiveIndex(null)}
          onMouseEnter={(_, idx) => setActiveIndex(idx)}
        >
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.color}
              cursor="pointer"
              style={{
                transition: "transform .2s",
                filter: activeIndex === i ? "brightness(1.25)" : undefined,
                transform: activeIndex === i ? "scale(1.06)" : "scale(1)"
              }}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload && payload.length ? (
              <motion.div
                className="bg-background border border-border p-2 rounded-md shadow-md"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-medium">{payload[0].payload.name}</p>
                <p className="text-sm">{payload[0].payload.value}</p>
              </motion.div>
            ) : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
