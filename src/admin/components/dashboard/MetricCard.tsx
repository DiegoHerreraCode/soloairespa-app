import { DivideIcon as LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: typeof LucideIcon;
  color: string;
}

export const MetricCard = ({ title, value, subtitle, icon: Icon, color }: Props) => {
  return (
    <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="text-3xl font-extrabold text-foreground tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/80 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};
