
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

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ data, height = 280 }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            hide 
            domain={[0, maxValue * 1.1]}
          />
          <Tooltip
            content={({ active, payload, label }) => 
              active && payload && payload.length ? (
                <motion.div
                  className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 p-4 rounded-xl shadow-xl"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {label}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {payload[0].payload.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    demandas
                  </div>
                </motion.div>
              ) : null
            }
          />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            isAnimationActive={isAnimated}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`bar-${index}`}
                fill={entry.color}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{
                  filter: activeIndex === index 
                    ? "brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.25))" 
                    : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  transform: activeIndex === index ? "scaleY(1.05)" : "scaleY(1)",
                  transformOrigin: "bottom",
                  transition: "all 0.2s ease"
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Estatísticas resumidas */}
      <motion.div
        className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {data.reduce((sum, item) => sum + item.value, 0)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Total
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {Math.max(...data.map(d => d.value))}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Máximo
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(1)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Média
          </div>
        </div>
      </motion.div>
    </div>
  );
};
