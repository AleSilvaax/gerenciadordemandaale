
import React from "react";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  id?: string;
  max?: number;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  id,
  max = 5,
}) => {
  return (
    <div className="flex items-center space-x-1" id={id}>
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={`cursor-pointer ${
            i < value ? "text-yellow-400" : "text-gray-300"
          }`}
          aria-label={`Avaliar com ${i + 1} estrela${i + 1 > 1 ? "s" : ""}`}
        >
          <Star size={24} fill={i < value ? "#facc15" : "none"} />
        </button>
      ))}
    </div>
  );
};
