
import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface ChartLineProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  activeMonth?: string;
}

export const ChartLine: React.FC<ChartLineProps> = ({ data, activeMonth }) => {
  const gradientId = "colorGradient";

  // Determine active index based on activeMonth
  const activeIndex = data.findIndex(item => item.name === activeMonth);

  return (
    <div className="w-full h-40 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: '#6b7280', 
              fontSize: 12 
            }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-secondary p-2 rounded-md border border-white/10 shadow-md">
                    <p className="text-sm">{`${payload[0].payload.name}: ${payload[0].value}`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#colorGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={({ cx, cy, stroke, index }) => (
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={index === activeIndex ? "#FFFFFF" : "transparent"}
                stroke={stroke}
                strokeWidth={index === activeIndex ? 2 : 0}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
