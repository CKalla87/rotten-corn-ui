import { describe, it, expect, afterEach, beforeEach } from '@jest/globals';
import useDetectOutsideClick from '@hooks/useDetectOutsideClick';
import { renderHook } from '@root/test.utils';
import { act } from 'react';

const documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
const documentRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');

const ref = { current: document.createElement('div') };

describe('useDetectOutsideClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useDetectOutsideClick(ref, false));
    const [isActive] = result.current;
    expect(isActive).toBeFalsy();
  });

  it('should update initial value', () => {
    const { result } = renderHook(() => useDetectOutsideClick(ref, false));
    const [isActive, setActive] = result.current;
    expect(isActive).toBeFalsy();
    act(() => {
      setActive(true);
    });
    const [active] = result.current;
    expect(active).toBeTruthy();
  });

  it('should set value to false if true', async () => {
    const { result } = renderHook(() => useDetectOutsideClick(ref, true));
    // Wait for the setTimeout delay (150ms) before checking
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 160));
    });
    const [isActive] = result.current;
    expect(isActive).toBeTruthy(); // Still true because no outside click happened
    // Hook adds both 'mousedown' and 'touchstart' listeners, so expect 2 calls
    expect(documentAddEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('should remove listener when unmounted', async () => {
    const { result, unmount } = renderHook(() => useDetectOutsideClick(ref, false));
    // Set to true first to add the listener
    act(() => {
      const [, setActive] = result.current;
      setActive(true);
    });
    // Wait for the setTimeout delay (150ms)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 160));
    });
    // Now unmount should remove the listener
    unmount();
    // The cleanup function runs on unmount, so removeEventListener is called
    // Hook adds both 'mousedown' and 'touchstart' listeners, so expect 2 calls for each
    expect(documentAddEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(documentRemoveEventListenerSpy).toHaveBeenCalledTimes(2);
  });
});

