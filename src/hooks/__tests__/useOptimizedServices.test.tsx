
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedServices } from '../useOptimizedServices';
import { mockService } from '@/test/utils';

// Mock the store
vi.mock('@/store/serviceStore', () => ({
  useServiceStore: () => ({
    services: [mockService],
    isLoading: false,
    error: null,
    filters: {
      status: 'all',
      priority: 'all',
      serviceType: 'all',
      searchTerm: '',
    },
    setFilters: vi.fn(),
    loadServices: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock performance utils
vi.mock('@/utils/performance', () => ({
  useFilteredServices: vi.fn(() => [mockService]),
  useDebounce: vi.fn((fn) => fn),
}));

describe('useOptimizedServices', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('returns optimized services data', () => {
    const { result } = renderHook(() => useOptimizedServices(), {
      wrapper: createWrapper(),
    });

    expect(result.current.services).toEqual([mockService]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('calculates service statistics correctly', () => {
    const { result } = renderHook(() => useOptimizedServices(), {
      wrapper: createWrapper(),
    });

    expect(result.current.serviceStats).toEqual({
      total: 1,
      pending: 1,
      inProgress: 1,
      completed: 0,
      highPriority: 0,
      completionRate: 0,
    });
  });

  it('provides action handlers', () => {
    const { result } = renderHook(() => useOptimizedServices(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.actions.loadServices).toBe('function');
    expect(typeof result.current.actions.setSearchTerm).toBe('function');
    expect(typeof result.current.actions.setStatusFilter).toBe('function');
  });
});
