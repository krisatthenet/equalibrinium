import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils.js';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'kept')).toBe('base kept');
  });

  it('handles undefined and null values', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('resolves Tailwind conflicts by keeping the last value', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('resolves Tailwind text-color conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles object syntax', () => {
    expect(cn({ 'text-bold': true, 'text-italic': false })).toBe('text-bold');
  });

  it('handles arrays of class names', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('returns empty string when called with no args', () => {
    expect(cn()).toBe('');
  });
});
