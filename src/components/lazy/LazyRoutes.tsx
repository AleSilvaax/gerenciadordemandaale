
import React, { Suspense } from 'react';
import { PageLoader } from '@/components/common/PageLoader';

// Lazy load all pages
const Index = React.lazy(() => import('@/pages/Index'));
const Demandas = React.lazy(() => import('@/pages/Demandas'));
const ServiceDetail = React.lazy(() => import('@/pages/ServiceDetail'));
const NewService = React.lazy(() => import('@/pages/NewService'));
const Estatisticas = React.lazy(() => import('@/pages/Estatisticas'));
const Equipe = React.lazy(() => import('@/pages/Equipe'));
const Search = React.lazy(() => import('@/pages/Search'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// HOC for wrapping lazy components with Suspense
const withSuspense = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
};

// Export wrapped components
export const LazyIndex = withSuspense(Index);
export const LazyDemandas = withSuspense(Demandas);
export const LazyServiceDetail = withSuspense(ServiceDetail);
export const LazyNewService = withSuspense(NewService);
export const LazyEstatisticas = withSuspense(Estatisticas);
export const LazyEquipe = withSuspense(Equipe);
export const LazySearch = withSuspense(Search);
export const LazySettings = withSuspense(Settings);
export const LazyLogin = withSuspense(Login);
export const LazyRegister = withSuspense(Register);
export const LazyNotFound = withSuspense(NotFound);
