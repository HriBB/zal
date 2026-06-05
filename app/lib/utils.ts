import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ClassValue } from 'clsx'

/**
 * Merge class names with Tailwind-conflict resolution: clsx joins/filters,
 * twMerge then lets a later conflicting utility override an earlier one so a
 * component's `className` prop can actually override its base classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
