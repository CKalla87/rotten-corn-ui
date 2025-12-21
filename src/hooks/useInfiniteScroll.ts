import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

const useInfiniteScroll = (
  bodyRef: RefObject<HTMLElement>,
  bottomLineRef: RefObject<HTMLElement>,
  callback: () => void
) => {
  // Check if we should use window scroll (mobile) or container scroll (desktop)
  const shouldUseWindowScroll = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return true;
    
    // Check if container is actually scrollable
    const container = bodyRef?.current;
    if (!container) return false;
    
    const computedStyle = window.getComputedStyle(container);
    const overflowY = computedStyle.overflowY;
    const isScrollable = overflowY === 'scroll' || overflowY === 'auto';
    
    // Use window scroll if container is not scrollable
    return !isScrollable;
  }, [bodyRef]);

  const handleScroll = useCallback(() => {
    const bottomLine = bottomLineRef?.current;
    if (!bottomLine) return;

    const useWindowScroll = shouldUseWindowScroll();

    if (useWindowScroll) {
      // Mobile: Use window scroll position
      const windowHeight = window.innerHeight;
      const bottomLineTop = bottomLine.getBoundingClientRect().top;
      
      // Trigger when bottom line is within viewport (with some threshold)
      // This ensures we load more posts before user reaches the absolute bottom
      const threshold = 300; // Load more when 300px from bottom of viewport
      if (bottomLineTop <= windowHeight + threshold) {
        callback();
      }
    } else {
      // Desktop: Use container scroll position (original logic)
      const container = bodyRef?.current;
      if (!container) return;
      
      const containerHeight = container.getBoundingClientRect().height;
      const bottomLineTop = bottomLine.getBoundingClientRect().top;
      
      // Original logic: trigger when bottom line reaches or passes container height
      if (bottomLineTop <= containerHeight) {
        callback();
      }
    }
  }, [bodyRef, bottomLineRef, callback, shouldUseWindowScroll]);

  useEffect(() => {
    const bodyRefCurrent = bodyRef?.current;
    const useWindowScroll = shouldUseWindowScroll();

    if (useWindowScroll) {
      // Mobile: Listen to window scroll
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    } else {
      // Desktop: Listen to container scroll
      bodyRefCurrent?.addEventListener('scroll', handleScroll, true);
      return () => bodyRefCurrent?.removeEventListener('scroll', handleScroll, true);
    }
  }, [bodyRef, handleScroll, shouldUseWindowScroll]);
};

export default useInfiniteScroll;

