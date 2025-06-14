
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from "recharts";
import { motion } from "framer-motion";

// Cores suaves (verde, laranja, vermelho)
const subtleColors = ["#22c55e", "#f59e0b", "#ef4444"];

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface AnimatedPieChartProps {
  data: PieData[];
  height?: number;
}

// Custom label central que mostra total
const renderCenterLabel = (props: any) => {
  const { cx, cy } = props;
  const total = props.payload?.reduce?.((sum: number, p: any) => sum + p.value, 0) ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
      className="fill-foreground font-bold text-[1.4rem] pointer-events-none"
    >
      {total}
    </text>
  );
};

// Label para cada fatia, ajustando posição
const renderPieLabel = (props: any) => {
  const RADIAN = Math.PI / 180;
  const radius = props.innerRadius + (props.outerRadius - props.innerRadius) * 0.62;
  const x = props.cx + radius * Math.cos(-props.midAngle * RADIAN);
  const y = props.cy + radius * Math.sin(-props.midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={props.fill}
      textAnchor={x > props.cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={14}
      fontWeight={600}
      opacity={0.94}
    >
      {props.value > 0 ? props.value : ""}
    </text>
  );
};

export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({ data, height = 230 }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Usar um conjunto limitado de cores suaves para consistência visual
  const dataWithColors = data.map((entry, i) => ({
    ...entry,
    color: subtleColors[i] || entry.color
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={86}
          startAngle={90}
          endAngle={-270}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive
          animationDuration={950}
          animationEasing="ease-out"
          onMouseLeave={() => setActiveIndex(null)}
          onMouseEnter={(_, idx) => setActiveIndex(idx)}
          label={renderPieLabel}
        >
          {dataWithColors.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.color}
              cursor="pointer"
              style={{
                transition: "filter .2s, transform .15s",
                filter: activeIndex === i ? "brightness(1.18)" : "none",
                transform: activeIndex === i ? "scale(1.06)" : undefined
              }}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload && payload.length ? (
              <motion.div
                className="bg-card border border-border p-2 rounded shadow-md min-w-[120px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22 }}
              >
                <div className="font-semibold text-xs mb-1 capitalize">{payload[0]?.name}</div>
                <span className="text-lg font-bold">{payload[0]?.value}</span>
              </motion.div>
            ) : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

