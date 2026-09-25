import type { ComponentProps, ReactNode } from 'react';

/** Text-only action labels share centered, responsive layout everywhere. */
export function ButtonContent({ children }: { children: ReactNode }) {
  return <span className="ss-button-label">{children}</span>;
}
export function Button({ children, className = '', size = 'md', fullWidth = false, ...props }: ComponentProps<'button'> & { size?: 'sm' | 'md' | 'lg'; fullWidth?: boolean }) {
  return <button {...props} className={['ss-button',className].join(' ')} data-size={size} data-full-width={fullWidth || undefined}><ButtonContent>{children}</ButtonContent></button>;
}
