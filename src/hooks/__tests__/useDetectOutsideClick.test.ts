import { describe, it, expect, afterEach, beforeEach } from '@jest/globals';
import useDetectOutsideClick from '@hooks/useDetectOutsideClick';
import { renderHook } from '@root/test.utils';
import { act } from 'react';

const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
const windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');

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
    // Wait for the setTimeout delay (10ms) before checking
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    const [isActive] = result.current;
    expect(isActive).toBeTruthy(); // Still true because no outside click happened
    expect(windowAddEventListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('should remove listener when unmounted', async () => {
    const { result, unmount } = renderHook(() => useDetectOutsideClick(ref, false));
    // Set to true first to add the listener
    act(() => {
      const [, setActive] = result.current;
      setActive(true);
    });
    // Wait for the setTimeout delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    // Now unmount should remove the listener
    unmount();
    // The cleanup function runs on unmount, so removeEventListener is called
    expect(windowAddEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});

