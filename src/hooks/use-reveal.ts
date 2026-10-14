import { useEffect, useRef } from 'react';

// Fades in `[data-reveal]` descendants as they scroll into view. Server HTML
// stays visible; only content below the fold is hidden, after hydration, so
// nothing on screen flickers. Items parked off to the side in a horizontal
// scroller stay visible so swiping never waits on a fade. Reduced motion skips
// the effect entirely.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = 'shown';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );
    for (const item of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight || rect.left >= window.innerWidth) continue;
      item.dataset.reveal = 'hidden';
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, []);

  return ref;
}
