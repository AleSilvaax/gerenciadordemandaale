
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

interface BarData {
  name: string;
  value: number;
  color: string;
}

interface AnimatedBarChartProps {
  data: BarData[];
  height?: number;
}

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ data, height = 220 }) => {
  // Destaque animado de barra ao hover
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis hide />
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
                <p className="text-sm">{`Quantidade: ${payload[0].payload.value}`}</p>
              </motion.div>
            ) : null
          }
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`bar-${index}`}
              fill={entry.color}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{
                transition: "all 0.3s",
                filter: activeIndex === index ? "brightness(1.23)" : "none"
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
