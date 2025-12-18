import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

const useDetectOutsideClick = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  initialState: boolean,
  excludeRef?: RefObject<HTMLElement | null>
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] => {
  const [isActive, setIsActive] = useState(initialState);

  useEffect(() => {
    const onClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking inside the menu
      if (ref.current !== null && ref.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking on the button that opens the menu
      if (excludeRef && excludeRef.current !== null && excludeRef.current.contains(target)) {
        return;
      }
      
      // Close the menu if clicking outside
      setIsActive(false);
    };

    if (isActive) {
      // Use a delay to prevent the click that opened the menu from immediately closing it
      // This allows the onClick handler to toggle the state first
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', onClick as EventListener);
        document.addEventListener('touchstart', onClick as EventListener);
      }, 150);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', onClick as EventListener);
        document.removeEventListener('touchstart', onClick as EventListener);
      };
    }
  }, [isActive, ref, excludeRef]);

  return [isActive, setIsActive];
};

export default useDetectOutsideClick;

