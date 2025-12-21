import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import useInfiniteScroll from '@hooks/useInfiniteScroll';
import { renderHook, waitFor, act } from '@root/test.utils';

describe('useInfiniteScroll', () => {
  let bodyRef: { current: HTMLDivElement };
  let bottomLineRef: { current: HTMLDivElement };
  let mockCallback: jest.Mock;
  let bodyAddEventListenerSpy: jest.SpyInstance;
  let bodyRemoveEventListenerSpy: jest.SpyInstance;
  let windowAddEventListenerSpy: jest.SpyInstance;
  let windowRemoveEventListenerSpy: jest.SpyInstance;
  let getComputedStyleSpy: jest.SpyInstance;
  let originalInnerWidth: number;

  beforeEach(() => {
    bodyRef = { current: document.createElement('div') };
    bottomLineRef = { current: document.createElement('div') };
    mockCallback = jest.fn();
    
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;
    
    // Mock getComputedStyle - will be updated in nested beforeEach blocks
    getComputedStyleSpy = jest.spyOn(window, 'getComputedStyle');
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    jest.restoreAllMocks();
  });

  describe('Desktop mode (container scroll)', () => {
    beforeEach(() => {
      // Set window width to desktop size (> 768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      // Ensure elements are properly initialized
      bodyRef.current = document.createElement('div');
      bottomLineRef.current = document.createElement('div');
      
      // Update getComputedStyle mock to return scrollable for the current bodyRef
      const mockComputedStyle = {
        overflowY: 'auto',
        overflowX: 'visible',
        getPropertyValue: jest.fn(() => ''),
      } as unknown as CSSStyleDeclaration;
      getComputedStyleSpy.mockImplementation((el) => {
        if (el === bodyRef.current) {
          return mockComputedStyle;
        }
        return {
          overflowY: 'visible',
          overflowX: 'visible',
          getPropertyValue: jest.fn(() => ''),
        } as unknown as CSSStyleDeclaration;
      });
    });

    it('should call addEventListener on container for desktop', async () => {
      // Initialize all spies before the hook runs
      bodyAddEventListenerSpy = jest.spyOn(bodyRef.current, 'addEventListener');
      bodyRemoveEventListenerSpy = jest.spyOn(bodyRef.current, 'removeEventListener');
      windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
      windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      renderHook(() => useInfiniteScroll(bodyRef, bottomLineRef, mockCallback));
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(bodyAddEventListenerSpy).toHaveBeenCalledTimes(1);
      });
      
      expect(bodyAddEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
      expect(bodyRemoveEventListenerSpy).toHaveBeenCalledTimes(0);
      expect(windowAddEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should call removeEventListener on container for desktop', async () => {
      // Initialize all spies before the hook runs
      bodyAddEventListenerSpy = jest.spyOn(bodyRef.current, 'addEventListener');
      bodyRemoveEventListenerSpy = jest.spyOn(bodyRef.current, 'removeEventListener');
      windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
      windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useInfiniteScroll(bodyRef, bottomLineRef, mockCallback));
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(bodyAddEventListenerSpy).toHaveBeenCalledTimes(1);
      });
      
      act(() => {
        unmount();
      });
      
      expect(bodyAddEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(bodyRemoveEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(bodyRemoveEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
      expect(windowRemoveEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Mobile mode (window scroll)', () => {
    beforeEach(() => {
      // Set window width to mobile size (<= 768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      // Ensure elements are properly initialized
      bodyRef.current = document.createElement('div');
      bottomLineRef.current = document.createElement('div');
      
      // Update getComputedStyle mock (though it shouldn't be called in mobile mode)
      const mockComputedStyle = {
        overflowY: 'auto',
        overflowX: 'visible',
        getPropertyValue: jest.fn(() => ''),
      } as unknown as CSSStyleDeclaration;
      getComputedStyleSpy.mockImplementation((el) => {
        if (el === bodyRef.current) {
          return mockComputedStyle;
        }
        return {
          overflowY: 'visible',
          overflowX: 'visible',
          getPropertyValue: jest.fn(() => ''),
        } as unknown as CSSStyleDeclaration;
      });
    });

    it('should call addEventListener on window for mobile', async () => {
      // Initialize all spies before the hook runs
      bodyAddEventListenerSpy = jest.spyOn(bodyRef.current, 'addEventListener');
      bodyRemoveEventListenerSpy = jest.spyOn(bodyRef.current, 'removeEventListener');
      windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
      windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      renderHook(() => useInfiniteScroll(bodyRef, bottomLineRef, mockCallback));
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(windowAddEventListenerSpy).toHaveBeenCalledTimes(1);
      });
      
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledTimes(0);
      expect(bodyAddEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should call removeEventListener on window for mobile', async () => {
      // Initialize all spies before the hook runs
      bodyAddEventListenerSpy = jest.spyOn(bodyRef.current, 'addEventListener');
      bodyRemoveEventListenerSpy = jest.spyOn(bodyRef.current, 'removeEventListener');
      windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
      windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useInfiniteScroll(bodyRef, bottomLineRef, mockCallback));
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(windowAddEventListenerSpy).toHaveBeenCalledTimes(1);
      });
      
      act(() => {
        unmount();
      });
      
      expect(windowAddEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(bodyRemoveEventListenerSpy).not.toHaveBeenCalled();
    });
  });
});

