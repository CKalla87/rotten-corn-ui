import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

const useDetectOutsideClick = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  initialState: boolean
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] => {
  const [isActive, setIsActive] = useState(initialState);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current !== null && !ref.current.contains(event.target as Node)) {
        setIsActive((prev) => !prev);
      }
    };

    if (isActive) {
      window.addEventListener('mousedown', onClick);
    }

    return () => {
      window.removeEventListener('mousedown', onClick);
    };
  }, [isActive, ref]);

  return [isActive, setIsActive];
};

export default useDetectOutsideClick;

