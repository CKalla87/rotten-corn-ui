import { useEffect, useRef } from 'react';

const useChatScrollToBottom = (prop: unknown) => {
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Try to find .chat-window-message first (production)
    // Fall back to ref (tests or when element not found)
    const scrollContainer = typeof document !== 'undefined' 
      ? (document.querySelector('.chat-window-message') as HTMLElement)
      : null;
    const targetElement = scrollContainer || scrollRef.current;
    
    if (targetElement) {
      // Use requestAnimationFrame for smoother scrolling
      // If scrollTo is not available or fails, fall back to direct assignment
      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (targetElement) {
              if (targetElement.scrollTo) {
                targetElement.scrollTo({
                  top: targetElement.scrollHeight,
                  behavior: 'smooth'
                });
              } else {
                // Fallback for test environments
                targetElement.scrollTop = targetElement.scrollHeight - targetElement.clientHeight;
              }
            }
          });
        });
      } catch {
        // Fallback for test environments that don't support requestAnimationFrame
        targetElement.scrollTop = targetElement.scrollHeight - targetElement.clientHeight;
      }
    }
  }, [prop]);

  return scrollRef as React.RefObject<HTMLDivElement>;
};

export default useChatScrollToBottom;

