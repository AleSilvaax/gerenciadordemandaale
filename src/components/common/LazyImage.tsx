
import React, { useState, useRef } from 'react';
import { useIntersectionObserver } from '@/utils/performance';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  const isIntersecting = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  React.useEffect(() => {
    if (isIntersecting && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isIntersecting, shouldLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
    >
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {!isLoaded && shouldLoad && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Erro ao carregar</span>
        </div>
      )}

      {placeholder && !shouldLoad && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        </div>
      )}
    </div>
  );
};
