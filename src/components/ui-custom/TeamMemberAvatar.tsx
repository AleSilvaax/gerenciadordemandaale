
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

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

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <Avatar 
      className={cn(
        "border border-white/20 bg-secondary",
        sizeClasses[size],
        className
      )}
    >
      <AvatarImage 
        src={src} 
        alt={name} 
        className="object-cover"
      />
      <AvatarFallback className="text-xs font-medium">
        {initials || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
};
