import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function Reveal({ as: Component = 'div', className, delay = 0, children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8%', threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      className={cn('midi-reveal', visible && 'is-visible', className)}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...props}
    >
      {children}
    </Component>
  );
}
