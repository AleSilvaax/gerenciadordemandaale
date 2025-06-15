
import React, { Suspense } from 'react';
import { PageLoader } from '@/components/common/PageLoader';

// Função para criar lazy imports com retry automático melhorado
const createLazyComponent = (importFn: () => Promise<any>, componentName: string) => {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error(`Erro ao carregar ${componentName}:`, error);
      
      // Retry uma vez após um pequeno delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await importFn();
      } catch (retryError) {
        console.error(`Falha no retry para ${componentName}:`, retryError);
        
        // Em vez de redirecionar, vamos retornar um componente de erro
        return {
          default: () => (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Erro ao carregar página</h2>
                <p className="text-muted-foreground mb-4">
                  Não foi possível carregar o componente {componentName}.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                >
                  Recarregar Página
                </button>
              </div>
            </div>
          )
        };
      }
    }
  });
};

// Lazy load all pages with improved retry mechanism
const Index = createLazyComponent(() => import('@/pages/Index'), 'Index');
const Demandas = createLazyComponent(() => import('@/pages/Demandas'), 'Demandas');
const ServiceDetail = createLazyComponent(() => import('@/pages/ServiceDetail'), 'ServiceDetail');
const NewService = createLazyComponent(() => import('@/pages/NewService'), 'NewService');
const Estatisticas = createLazyComponent(() => import('@/pages/Estatisticas'), 'Estatisticas');
const Equipe = createLazyComponent(() => import('@/pages/Equipe'), 'Equipe');
const Search = createLazyComponent(() => import('@/pages/Search'), 'Search');
const Settings = createLazyComponent(() => import('@/pages/Settings'), 'Settings');
const Login = createLazyComponent(() => import('@/pages/Login'), 'Login');
const Register = createLazyComponent(() => import('@/pages/Register'), 'Register');
const NotFound = createLazyComponent(() => import('@/pages/NotFound'), 'NotFound');

// HOC for wrapping lazy components with Suspense and error handling
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
