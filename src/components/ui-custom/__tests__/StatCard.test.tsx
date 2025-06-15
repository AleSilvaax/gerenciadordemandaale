
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { StatCard } from '../StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('renders with title and value', () => {
    render(
      <StatCard
        title="Test Title"
        value="123"
        icon={<TrendingUp data-testid="trend-icon" />}
        description="Test description"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByTestId('trend-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <StatCard
        title="Test"
        value="123"
        icon={<div />}
        className="custom-class"
      />
    );

    const statCard = screen.getByText('Test').closest('div');
    expect(statCard).toHaveClass('custom-class');
  });

  it('renders without description', () => {
    render(
      <StatCard
        title="Test Title"
        value="123"
        icon={<div />}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });
});
