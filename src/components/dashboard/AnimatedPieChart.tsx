
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

const defaultColors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface AnimatedPieChartProps {
  data: PieData[];
  height?: number;
}

const renderPieLabel = (props: any) => {
  const RADIAN = Math.PI / 180;
  const radius = props.innerRadius + (props.outerRadius - props.innerRadius) * 0.7;
  const x = props.cx + radius * Math.cos(-props.midAngle * RADIAN);
  const y = props.cy + radius * Math.sin(-props.midAngle * RADIAN);

  if (props.value === 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > props.cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={700}
      className="drop-shadow-lg"
    >
      {props.value}
    </text>
  );
};

export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({ data, height = 280 }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const dataWithColors = data.map((entry, i) => ({
    ...entry,
    color: entry.color || defaultColors[i % defaultColors.length]
  }));

  const total = dataWithColors.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={110}
            startAngle={90}
            endAngle={-270}
            paddingAngle={4}
            dataKey="value"
            isAnimationActive={isAnimated}
            animationDuration={1200}
            animationEasing="ease-out"
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
            label={renderPieLabel}
          >
            {dataWithColors.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.color}
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
                style={{
                  filter: activeIndex === i ? "brightness(1.15) drop-shadow(0 0 8px rgba(0,0,0,0.3))" : "none",
                  transform: activeIndex === i ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "all 0.2s ease"
                }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <motion.div
                  className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 p-4 rounded-xl shadow-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {payload[0]?.name}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {payload[0]?.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {total > 0 ? `${Math.round((payload[0]?.value / total) * 100)}%` : '0%'} do total
                  </div>
                </motion.div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centro com total */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            {total}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Total
          </div>
        </div>
      </motion.div>

      {/* Legenda */}
      <motion.div
        className="flex flex-wrap justify-center gap-4 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        {dataWithColors.map((entry, index) => (
          <motion.div
            key={entry.name}
            className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-slate-700/50 rounded-lg"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + index * 0.1 }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {entry.name}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {entry.value}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
