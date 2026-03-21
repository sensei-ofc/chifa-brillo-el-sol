import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, glow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'premium-card p-6 relative overflow-hidden',
          glow && 'before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-gold-champagne/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
          className
        )}
        {...props}
      />
    );
  }
);
PremiumCard.displayName = 'PremiumCard';

export { PremiumCard };
