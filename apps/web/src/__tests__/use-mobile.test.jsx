import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../hooks/use-mobile.jsx';

function setWindowWidth(width) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

describe('useIsMobile', () => {
  beforeEach(() => {
    setWindowWidth(1024);
  });

  it('returns false on a wide viewport (>= 768px)', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true on a narrow viewport (< 768px)', () => {
    setWindowWidth(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false at exactly the breakpoint (768px)', () => {
    setWindowWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true at one pixel below the breakpoint (767px)', () => {
    setWindowWidth(767);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('always returns a boolean, never undefined', () => {
    setWindowWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe('boolean');
  });
});
