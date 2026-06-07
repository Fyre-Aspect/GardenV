import { avatarTone, initials, type Kind } from '@/lib/data';
import { KIND_ICON } from '@/components/garden/icons';
import { cn } from '@/lib/utils';

interface PlantAvatarProps {
  name: string;
  kind?: Kind;
  className?: string;
  shape?: 'square' | 'round';
}

/**
 * Companion avatar. Each name maps to one stable, muted tone so the set reads
 * calm and cohesive. Pets show a paw mark; plants show their initials.
 */
export function PlantAvatar({ name, kind = 'plant', className, shape = 'square' }: PlantAvatarProps) {
  const Icon = KIND_ICON[kind];
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
      {kind === 'pet' ? <Icon className="h-1/2 w-1/2" strokeWidth={2.25} /> : initials(name)}
    </div>
  );
}
