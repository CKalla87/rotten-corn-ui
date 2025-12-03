import { describe, it, expect, beforeEach } from '@jest/globals';
import useInfiniteScroll from '@hooks/useInfiniteScroll';
import { renderHook } from '@root/test.utils';

describe('useInfiniteScroll', () => {
  let bodyRef: { current: HTMLDivElement };
  let bottomLineRef: { current: HTMLDivElement };
  let mockCallback: jest.Mock;
  let bodyAddEventListenerSpy: jest.SpyInstance;
  let bodyRemoveEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    bodyRef = { current: document.createElement('div') };
    bottomLineRef = { current: document.createElement('div') };
    mockCallback = jest.fn();
    bodyAddEventListenerSpy = jest.spyOn(bodyRef.current, 'addEventListener');
    bodyRemoveEventListenerSpy = jest.spyOn(bodyRef.current, 'removeEventListener');
  });

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

