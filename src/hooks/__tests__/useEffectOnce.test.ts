import { describe, it, expect, vi } from 'vitest';
import useEffectOnce from '@hooks/useEffectOnce';
import { renderHook } from '@root/test.utils';

describe('useEffectOnce', () => {
  it('should run provided effect only once', () => {
    const mockEffectCallback = vi.fn();
    const { rerender } = renderHook(() => useEffectOnce(mockEffectCallback));
    expect(mockEffectCallback).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockEffectCallback).toHaveBeenCalledTimes(1);
  });
});

