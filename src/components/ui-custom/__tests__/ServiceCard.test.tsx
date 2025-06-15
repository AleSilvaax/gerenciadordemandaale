
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ServiceCard } from '../ServiceCard';
import { mockService } from '@/test/utils';

describe('ServiceCard', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service information correctly', () => {
    render(
      <ServiceCard
        service={mockService}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(mockService.title)).toBeInTheDocument();
    expect(screen.getByText(mockService.location)).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <ServiceCard
        service={mockService}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Excluir');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockService.id);
  });

  it('displays correct status badge', () => {
    render(
      <ServiceCard
        service={mockService}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(
      <ServiceCard
        service={mockService}
        onDelete={mockOnDelete}
        compact={true}
      />
    );

    expect(screen.getByText(mockService.title)).toBeInTheDocument();
  });
});
