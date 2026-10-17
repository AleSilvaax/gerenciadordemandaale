import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const defaultColors = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6"];

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface AnimatedPieChartProps {
  data: PieData[];
  height?: number;
}

export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  height = 240,
}) => {
  const dataWithColors = data.map((entry, i) => ({
    ...entry,
    color: entry.color || defaultColors[i % defaultColors.length],
  }));

  const total = dataWithColors.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="space-y-4">
      <div className="relative w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {dataWithColors.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload && payload.length ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
                    <p className="font-semibold text-slate-900">
                      {payload[0]?.name}
                    </p>
                    <p className="font-mono text-slate-600 mt-0.5">
                      {payload[0]?.value || 0} demanda
                      {Number(payload[0]?.value) !== 1 ? "s" : ""} (
                      {total > 0 && payload[0]?.value
                        ? `${Math.round(
                            (Number(payload[0].value) / total) * 100
                          )}%`
                        : "0%"}
                      )
                    </p>
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Valor Centralizado */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white leading-none">
            {total}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-1">
            Total
          </span>
        </div>
      </div>

      {/* Legenda Única e Limpa */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
        {dataWithColors.map((entry, index) => {
          const pct =
            total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {entry.value}
              </span>
              <span className="text-slate-400 text-[11px]">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
