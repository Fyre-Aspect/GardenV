import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  children?: React.ReactNode;
}

/** Consistent heading + optional sub-copy / trailing action used across pages. */
export function SectionHeader({
  title,
  description,
  align = 'left',
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6',
        align === 'center'
          ? 'text-center'
          : 'flex items-end justify-between gap-4',
        className
      )}
    >
      <div>
        <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
