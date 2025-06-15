import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { customRender as render, screen, fireEvent };

// Mock data generators
export const mockService = {
  id: 'test-service-1',
  title: 'Test Service',
  description: 'Test service description',
  status: 'pendente' as const,
  priority: 'media' as const,
  serviceType: 'Vistoria' as const,
  client: 'Test Client',
  address: 'Test Address, 123',
  location: 'Test Location, 123',
  dueDate: new Date().toISOString(),
  creationDate: new Date().toISOString(),
  technician: {
    id: 'tech-1',
    name: 'Test Technician',
    avatar: '',
    role: 'tecnico' as const,
  },
  messages: [],
  photos: [],
};

export const mockTeamMember = {
  id: 'member-1',
  name: 'Test Member',
  role: 'tecnico' as const,
  avatar: '',
};

export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'administrador' as const,
};
