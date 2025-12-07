import { useEffect, useRef } from 'react';

const useChatScrollToBottom = (prop: unknown) => {
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current?.scrollHeight - scrollRef.current?.clientHeight;
    }
  }, [prop]);

  return scrollRef as React.RefObject<HTMLDivElement>;
};

export default useChatScrollToBottom;

