
import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [isScrolling, setIsScrolling] = useState(false);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    
    return (
      <div style={style} className={cn('flex items-center', isScrolling && 'pointer-events-none')}>
        {renderItem(item, index)}
      </div>
    );
  }, [items, renderItem, isScrolling]);

  const handleScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    // Use a timeout to detect when scrolling stops
    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [isScrolling]);

  const memoizedList = useMemo(() => (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscan}
      onScroll={handleScroll}
      className={className}
    >
      {Row}
    </List>
  ), [items.length, height, itemHeight, overscan, Row, className, handleScroll]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Nenhum item encontrado
      </div>
    );
  }

  return memoizedList;
}
