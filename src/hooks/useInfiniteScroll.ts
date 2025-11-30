import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

const useInfiniteScroll = (
  bodyRef: RefObject<HTMLElement>,
  bottomLineRef: RefObject<HTMLElement>,
  callback: () => void
) => {
  const handleScroll = useCallback(() => {
    const containerHeight = bodyRef?.current?.getBoundingClientRect().height;
    const { top: bottomLineTop } = bottomLineRef?.current?.getBoundingClientRect() || { top: 0 };
    if (bottomLineTop <= (containerHeight || 0)) {
      callback();
    }
  }, [bodyRef, bottomLineRef, callback]);

  useEffect(() => {
    const bodyRefCurrent = bodyRef?.current;
    bodyRefCurrent?.addEventListener('scroll', handleScroll, true);
    return () => bodyRefCurrent?.removeEventListener('scroll', handleScroll, true);
  }, [bodyRef, handleScroll]);
};

export default useInfiniteScroll;

