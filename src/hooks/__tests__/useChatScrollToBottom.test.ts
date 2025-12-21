import { describe, it, expect, beforeEach } from '@jest/globals';
import React, { forwardRef } from 'react';
import useChatScrollToBottom from '@hooks/useChatScrollToBottom';
import { render, renderHook, screen } from '@root/test.utils';

interface DemoContainerProps {
  dataList: number[];
}

const DemoContainer = forwardRef<HTMLDivElement, DemoContainerProps>((props, ref) => {
  return React.createElement(
    'div',
    { ref, 'data-testid': 'demo-container' },
    props.dataList.map((data, index) => React.createElement('div', { key: index }, data))
  );
});

DemoContainer.displayName = 'DemoContainer';

let dataList = Array(50)
  .fill(0)
  .map((_v, i) => i + 1);

describe('useChatScrollToBottom', () => {
  it('should be defined', () => {
    expect(useChatScrollToBottom).toBeDefined();
  });

  describe('props', () => {
    let hook: { result: { current: ReturnType<typeof useChatScrollToBottom> }; rerender: (props?: number[]) => void };

    beforeEach(() => {
      hook = renderHook((value: number[]) => useChatScrollToBottom(value), {
        initialProps: [] as number[]
      });
      hook.rerender(dataList);
    });

    it('should have an element ref', () => {
      const { current } = hook.result.current;
      expect(current).toBeDefined();
    });
  });

  describe('scroll', () => {
    let hook: { result: { current: ReturnType<typeof useChatScrollToBottom> }; rerender: () => void };
    const scrollerNode = document.createElement('div');

    beforeEach(() => {
      hook = renderHook(() => useChatScrollToBottom(dataList));
      render(React.createElement(DemoContainer, { dataList, ref: hook.result.current }));
      hook.result.current.current = scrollerNode;
      hook.rerender();
    });

    it('should have zero scrollTop value', async () => {
      const demoContainer = screen.queryByTestId('demo-container');
      const end = 200;
      const start = 50;
      const dataList2 = Array.from({ length: end - start }, (_v, i) => start + 1 + i);
      dataList = [...dataList, ...dataList2];
      hook.rerender();
      expect(demoContainer?.scrollTop).toEqual(0);
    });

    it('should have scrollTop value greater than zero', async () => {
      const demoContainer = screen.queryByTestId('demo-container');
      if (demoContainer) {
        // Set the ref to point to the actual DOM element
        hook.result.current.current = demoContainer as HTMLDivElement;
        // Set scroll properties on the element the ref points to
        Object.defineProperty(demoContainer, 'scrollHeight', { configurable: true, value: 150, writable: true });
        Object.defineProperty(demoContainer, 'clientHeight', { configurable: true, value: 100, writable: true });
        Object.defineProperty(demoContainer, 'scrollTop', { configurable: true, writable: true, value: 0 });
        const end = 500;
        const start = 200;
        const dataList2 = Array.from({ length: end - start }, (_v, i) => start + 1 + i);
        dataList = [...dataList, ...dataList2];
        hook.rerender();
        // Wait for useEffect to run and set scrollTop (need longer delay for requestAnimationFrame in test)
        await new Promise(resolve => setTimeout(resolve, 100));
        // The hook sets scrollTop = scrollHeight - clientHeight = 150 - 100 = 50
        expect(demoContainer.scrollTop).toBeGreaterThan(0);
      }
    });
  });
});

