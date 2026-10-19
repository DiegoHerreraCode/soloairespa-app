import { DivideIcon as LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof LucideIcon;
  badgeText?: string;
  badgeColor?: string;
  ivaVentas?: string;
  ivaCompras?: string;
}

export const FinanceSummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-primary/10 text-primary',
  ivaVentas,
  ivaCompras,
}: Props) => {
  return (
    <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${badgeColor}`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {value}
          </span>
          {badgeText && (
            <span className="text-xs font-bold text-rose-500">
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium truncate">
          {subtitle}
        </p>
        {ivaVentas !== undefined && ivaCompras !== undefined && (
          <div className="mt-2 text-xs">
            <p className="text-green-600 font-medium">
              IVA Recaudado: ${ivaVentas}
            </p>
            <p className="text-red-600 font-medium">
              IVA Pagado: ${ivaCompras}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
