import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HorizontalScroller({ children, className = '', itemClassName = '', ariaLabel = 'Danh sách cuộn ngang' }) {
  const scrollerRef = useRef(null);
  const scrollByCard = (direction) => {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.min(node.clientWidth * 0.9, 420);
    node.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };
  const items = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className={cn('relative', className)}>
      <div className="mb-4 hidden justify-end gap-2 md:flex" aria-hidden="true">
        <Button type="button" size="icon" variant="outline" onClick={() => scrollByCard(-1)} aria-label="Cuộn sang trái">
          <ChevronLeft />
        </Button>
        <Button type="button" size="icon" variant="outline" onClick={() => scrollByCard(1)} aria-label="Cuộn sang phải">
          <ChevronRight />
        </Button>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={ariaLabel}
      >
        {items.map((item, index) => (
          <div key={item?.key || index} className={cn('min-w-[78%] snap-start sm:min-w-[46%] lg:min-w-[31%]', itemClassName)}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
