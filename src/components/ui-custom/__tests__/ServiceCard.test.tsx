
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ServiceCard } from '../ServiceCard';
import { mockService } from '@/test/utils';

describe('ServiceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service information correctly', () => {
    render(
      <ServiceCard
        service={mockService}
      />
    );

    expect(screen.getByText(mockService.title)).toBeInTheDocument();
    expect(screen.getByText(mockService.location)).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    render(
      <ServiceCard
        service={mockService}
      />
    );

    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('shows view details button', () => {
    render(
      <ServiceCard
        service={mockService}
      />
    );

    expect(screen.getByText('Ver Detalhes')).toBeInTheDocument();
  });

  it('renders with service description', () => {
    render(
      <ServiceCard
        service={mockService}
      />
    );

    expect(screen.getByText(mockService.title)).toBeInTheDocument();
  });
});
