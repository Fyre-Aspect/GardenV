import { avatarTone, initials } from '@/lib/data';
import { cn } from '@/lib/utils';

interface PlantAvatarProps {
  name: string;
  className?: string;
  shape?: 'square' | 'round';
}

/**
 * Initial-letter avatar. Each name maps to one stable, muted tone so the set
 * reads as calm and cohesive. Replaces the old plant/testimonial emoji.
 */
export function PlantAvatar({ name, className, shape = 'square' }: PlantAvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center font-black leading-none tracking-tight',
        shape === 'square' ? 'rounded-2xl' : 'rounded-full',
        avatarTone(name),
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
