
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
  text?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  text = 'Carregando...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};
