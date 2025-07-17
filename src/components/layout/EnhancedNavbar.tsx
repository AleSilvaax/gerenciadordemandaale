
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import UserProfileMenu from "./UserProfileMenu";
import { Link } from "react-router-dom";

export const EnhancedNavbar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">GD</span>
              </div>
              <span>GerenciadorDemandas</span>
            </Link>
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center gap-4">
            {/* Notification Center */}
            <NotificationCenter />

            {/* User Menu */}
            <UserProfileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};
