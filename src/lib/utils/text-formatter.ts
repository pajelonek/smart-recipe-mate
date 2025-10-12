import type { TruncateOptions } from '../../types';

export function truncate(text: string, options: TruncateOptions): string {
  const { length, suffix = '...' } = options;
  if (text.length <= length) return text;
  return text.slice(0, length) + suffix;
}
