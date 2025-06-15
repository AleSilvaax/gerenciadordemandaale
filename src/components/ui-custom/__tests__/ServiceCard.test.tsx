
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ServiceCard } from '../ServiceCard';
import { mockService } from '@/test/utils';

describe('ServiceCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service information correctly', () => {
    render(
      <ServiceCard
        service={mockService}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    expect(screen.getByText(mockService.title)).toBeInTheDocument();
    expect(screen.getByText(mockService.clientName)).toBeInTheDocument();
    expect(screen.getByText(mockService.address)).toBeInTheDocument();
  });

  it('calls onView when view button is clicked', () => {
    render(
      <ServiceCard
        service={mockService}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const viewButton = screen.getByText('Ver Detalhes');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockService.id);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <ServiceCard
        service={mockService}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockService.id);
  });

  it('displays correct status badge', () => {
    render(
      <ServiceCard
        service={mockService}
        onEdit={mockOnEdit}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});
