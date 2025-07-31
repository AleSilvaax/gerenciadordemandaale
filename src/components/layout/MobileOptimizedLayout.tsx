import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from './MobileHeader';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  onMenuClick?: () => void;
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  rightAction,
  onMenuClick
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {title && (
        <MobileHeader
          title={title}
          subtitle={subtitle}
          showBackButton={showBackButton}
          rightAction={rightAction}
          onMenuClick={onMenuClick}
        />
      )}
      
      <div className="container mx-auto p-4 space-y-4 pt-2 pb-20">
        {children}
      </div>
    </div>
  );
};