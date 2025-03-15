
import React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

interface TeamMemberAvatarProps {
  src: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

export const TeamMemberAvatar: React.FC<TeamMemberAvatarProps> = ({
  src,
  name,
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden border border-white/20 bg-secondary",
        sizeClasses[size],
        className
      )}
    >
      <img 
        src={src} 
        alt={name} 
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
};
