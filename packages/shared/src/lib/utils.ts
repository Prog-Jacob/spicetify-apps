import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const toggleInSet = <T>(set: Set<T>, item: T): Set<T> => {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
};
