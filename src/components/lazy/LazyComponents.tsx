
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load heavy components
export const LazyServiceDetail = lazy(() => import('@/pages/ServiceDetail'));
export const LazyStatistics = lazy(() => import('@/pages/Statistics'));
export const LazyNewService = lazy(() => import('@/pages/NewService'));
export const LazyEquipe = lazy(() => import('@/pages/Equipe'));
export const LazySettings = lazy(() => import('@/pages/Settings'));

// Loading wrapper component
export const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  }>
    {children}
  </Suspense>
);

// Pre-configured lazy components with loading states
export const LazyServiceDetailWithLoader = () => (
  <LazyWrapper>
    <LazyServiceDetail />
  </LazyWrapper>
);

export const LazyStatisticsWithLoader = () => (
  <LazyWrapper>
    <LazyStatistics />
  </LazyWrapper>
);

export const LazyNewServiceWithLoader = () => (
  <LazyWrapper>
    <LazyNewService />
  </LazyWrapper>
);

export const LazyEquipeWithLoader = () => (
  <LazyWrapper>
    <LazyEquipe />
  </LazyWrapper>
);

export const LazySettingsWithLoader = () => (
  <LazyWrapper>
    <LazySettings />
  </LazyWrapper>
);
