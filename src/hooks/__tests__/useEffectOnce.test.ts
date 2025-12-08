import { describe, it, expect } from '@jest/globals';
import useEffectOnce from '@hooks/useEffectOnce';
import { renderHook } from '@root/test.utils';

describe('useEffectOnce', () => {
  it('should run provided effect only once', () => {
    const mockEffectCallback = jest.fn();
    const { rerender } = renderHook(() => useEffectOnce(mockEffectCallback));
    expect(mockEffectCallback).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockEffectCallback).toHaveBeenCalledTimes(1);
  });
});

