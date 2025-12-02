import { describe, it, expect, vi } from 'vitest';
import useInfiniteScroll from '@hooks/useInfiniteScroll';
import { renderHook } from '@root/test.utils';

const bodyRef = { current: document.createElement('div') };
const bottomLineRef = { current: document.createElement('div') };
const mockCallback = vi.fn();

const bodyAddEventListenerSpy = vi.spyOn(bodyRef.current, 'addEventListener');
const bodyRemoveEventListenerSpy = vi.spyOn(bodyRef.current, 'removeEventListener');

describe('useInfiniteScroll', () => {
  it('should call addEventListener', () => {
    renderHook(() => useInfiniteScroll(bodyRef, bottomLineRef, mockCallback));
    expect(bodyAddEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(bodyRemoveEventListenerSpy).toHaveBeenCalledTimes(0);
  });

  it('should call removeEventListener', () => {
    const { unmount } = renderHook(() => useInfiniteScroll(bodyRef, bottomLineRef, mockCallback));
    unmount();
    expect(bodyAddEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(bodyRemoveEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});

