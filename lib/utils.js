import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge multiple class names with Tailwind CSS conflict resolution.
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to compact human-readable string (e.g. 1.2k, 4.5M).
 * @param {number|null|undefined} number
 * @returns {string}
 */
export function formatCompactNumber(number) {
  if (number == null || Number.isNaN(number)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
}
