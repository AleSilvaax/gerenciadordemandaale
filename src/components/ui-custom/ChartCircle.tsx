
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface ChartCircleProps {
  value: number;
  size?: number;
  thickness?: number;
  colors?: string[];
}

export const ChartCircle: React.FC<ChartCircleProps> = ({
  value,
  size = 150,
  thickness = 10,
  colors = ["#22c55e", "#3b82f6", "#6366f1"]
}) => {
  // Calculate remaining percentage
  const remaining = 100 - value;
  
  // Chart data
  const data = [
    { name: "Done", value: value },
    { name: "Remaining", value: remaining }
  ];

  // Colors based on the progress
  const primaryColor = colors[0];
  const remainingColor = "rgba(255, 255, 255, 0.1)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={index === 0 ? primaryColor : remainingColor}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div 
        className="absolute inset-0 flex items-center justify-center flex-col"
        style={{ fontSize: size / 4 }}
      >
        <div className="font-bold text-white">
          {value}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Atendidos
        </div>
      </div>
    </div>
  );
};
