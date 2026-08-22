import { useRef, useState } from 'react';

import { ImageWithFallback } from '@/components/common/image-with-fallback';

export function ProductGallery({ images = [], name }) {
  const safeImages = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);

  const start = (event) => {
    if (event.button !== 0) return;
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event) => {
    if (startX.current === null) return;
    setOffset(Math.max(-140, Math.min(140, event.clientX - startX.current)));
  };
  const end = () => {
    if (offset < -45 && active < safeImages.length - 1) setActive((index) => index + 1);
    if (offset > 45 && active > 0) setActive((index) => index - 1);
    startX.current = null;
    setOffset(0);
    setDragging(false);
  };

  if (!safeImages.length) safeImages.push(null);
  return (
    <div>
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-2xl border border-border/70 bg-secondary shadow-[0_18px_50px_rgba(48,33,24,0.08)]"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(calc(${-active * 100}% + ${offset}px),0,0)`,
            transition: dragging ? 'none' : undefined,
          }}
        >
          {safeImages.map((image, index) => (
            <div key={`${image || 'fallback'}-${index}`} className="h-full min-w-full">
              <ImageWithFallback
                src={image}
                alt={`${name} – ảnh ${index + 1}`}
                className="h-full w-full select-none object-contain p-5 sm:p-8"
                draggable="false"
              />
            </div>
          ))}
        </div>
        {safeImages.length > 1 ? (
          <div className="absolute inset-x-4 bottom-4 flex justify-center gap-1.5 lg:hidden">
            {safeImages.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setActive(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                className={`h-1 rounded-full transition-all ${active === index ? 'w-8 bg-white' : 'w-4 bg-white/45'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {safeImages.length > 1 ? (
        <div className="mt-3 hidden grid-cols-4 gap-3 lg:grid">
          {safeImages.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              onClick={() => setActive(index)}
              className={`overflow-hidden rounded-xl border bg-secondary transition-all duration-300 ${active === index ? 'border-primary shadow-sm' : 'border-transparent hover:-translate-y-0.5 hover:border-border'}`}
            >
              <ImageWithFallback
                src={image}
                alt=""
                className="aspect-square w-full object-contain p-2"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
