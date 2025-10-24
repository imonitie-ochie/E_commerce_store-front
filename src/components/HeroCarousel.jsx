import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Redesigned HeroCarousel
// - Accepts slides as objects: { image, title, subtitle, cta: { text, to }, alt }
// - Accessible: keyboard nav, ARIA labels, aria-live updates
// - Autoplay with pause-on-hover/focus, configurable interval
// - Manual controls (prev/next), indicators, and swipe support
// - Tailwind-based styling

export default function HeroCarousel({
  slides = [],
  autoplay = true,
  interval = 5000,
  heightClasses = 'h-56 md:h-72 lg:h-96',
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const slidesRef = useRef(slides);
  const timerRef = useRef(null);
  const pointerStartX = useRef(null);

  // ensure latest slides are available in callbacks
  useEffect(() => {
    slidesRef.current = slides;
    if (idx >= slides.length) setIdx(0);
  }, [slides, idx]);

  const next = useCallback(() => {
    setIdx(i => (slidesRef.current.length ? (i + 1) % slidesRef.current.length : 0));
  }, []);

  const prev = useCallback(() => {
    setIdx(i => (slidesRef.current.length ? (i - 1 + slidesRef.current.length) % slidesRef.current.length : 0));
  }, []);

  // Autoplay interval
  useEffect(() => {
    if (!autoplay || paused || !slides.length) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [autoplay, paused, interval, next, slides.length]);

  // Pause on hover / focus
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleFocus = () => setPaused(true);
  const handleBlur = () => setPaused(false);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Simple pointer (swipe) support
  const onPointerDown = (e) => {
    pointerStartX.current = e.clientX || (e.touches && e.touches[0].clientX);
  };
  const onPointerUp = (e) => {
    if (pointerStartX.current == null) return;
    const endX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const delta = endX - pointerStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) next();
      else prev();
    }
    pointerStartX.current = null;
  };

  // Render empty state
  if (!slides.length) {
    return (
      <div className={`w-full ${heightClasses} bg-gray-100 flex items-center justify-center rounded-lg`}>
        <div className="text-gray-500">No hero slides</div>
      </div>
    );
  }

  return (
    <section
      className={`relative w-full overflow-hidden rounded-lg`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Homepage hero carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Slides */}
      <div className={`relative ${heightClasses} select-none`}>
        {slides.map((s, i) => {
          const active = i === idx;
          return (
            <figure
              key={i}
              className={`absolute inset-0 transition-all duration-700 ease-out transform ${
                active ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 scale-98 -translate-x-2 z-0 pointer-events-none'
              }`}
              aria-hidden={!active}
            >
              {/* background image (img for semantic alt text and lazy loading) */}
              <img
                src={s.image}
                alt={s.alt || s.title || `slide-${i + 1}`}
                loading="lazy"
                className={`w-full h-full object-cover ${heightClasses}`}
                style={{ width: '100%', height: '100%' }}
              />

              {/* overlay content */}
              <figcaption
                className="absolute left-6 bottom-6 bg-black/60 text-white p-4 rounded max-w-md backdrop-blur-sm"
                aria-live={active ? 'polite' : 'off'}
              >
                {s.title && <h3 className="text-2xl md:text-3xl font-extrabold">{s.title}</h3>}
                {s.subtitle && <p className="mt-1 text-sm md:text-base">{s.subtitle}</p>}
                {s.cta && (
                  <Link
                    to={s.cta.to || '#'}
                    className="inline-block mt-3 px-4 py-2 bg-white text-black rounded text-sm font-medium"
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                  >
                    {s.cta.text}
                  </Link>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Controls: Prev / Next */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          onClick={prev}
          className="m-2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous slide"
        >
          ‹
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={next}
          className="m-2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-3 h-3 rounded-full focus:outline-none focus:ring-2 ${i === idx ? 'bg-white' : 'bg-white/40'}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === idx}
          />
        ))}
      </div>

      {/* Visually-hidden status for screen readers */}
      <div className="sr-only" aria-live="polite">
        {`Slide ${idx + 1} of ${slides.length}${slides[idx]?.title ? ': ' + slides[idx].title : ''}`}
      </div>
    </section>
  );
}
