import {ReactNode} from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}
export function Badge({children, className, withBorder = true}: BadgeProps) {
  return (
    <span
      className={clsx(
        'absolute right-4 top-2 flex items-center justify-center whitespace-nowrap rounded-full bg-warning text-xs font-bold text-white shadow',
        withBorder && 'border-2 border-white',
        children ? 'h-18 w-18' : 'h-12 w-12',
        className
      )}
    >
      {children}
    </span>
  );
}
