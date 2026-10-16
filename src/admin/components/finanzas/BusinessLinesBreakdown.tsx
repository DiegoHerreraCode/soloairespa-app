import { TrendingUp, TrendingDown } from 'lucide-react';

export interface BusinessLineData {
  number: number;
  title: string;
  subtitle: string;
  ingresos: number;
  egresos?: number;
}

interface Props {
  lines: BusinessLineData[];
}

export const BusinessLinesBreakdown = ({ lines }: Props) => {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Desglose Segmentado por Línea de Operación
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ingresos y egresos generados en el rango de fechas
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={14} /> Ingresos
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <TrendingDown size={14} /> Egresos
          </span>
        </div>
      </div>

      <div className="divide-y divide-border/60 mt-2">
        {lines.map((line) => (
          <div key={line.number} className="py-4 space-y-2 first:pt-2 last:pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {line.number}. {line.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {line.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm font-bold shrink-0 self-end sm:self-center">
                {line.ingresos > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    +${Math.round(line.ingresos).toLocaleString('es-CL')}
                  </span>
                )}
                {line.egresos !== undefined && line.egresos > 0 && (
                  <span className="text-rose-500 font-mono">
                    -${Math.round(line.egresos).toLocaleString('es-CL')}
                  </span>
                )}
                {line.ingresos === 0 && (!line.egresos || line.egresos === 0) && (
                  <span className="text-xs text-muted-foreground font-mono font-medium">
                    $0
                  </span>
                )}
              </div>
            </div>

            {/* Barra visual de proporción */}
            <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden flex">
              {line.ingresos > 0 && (
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(10, Math.round((line.ingresos / (line.ingresos + (line.egresos || 0) || 1)) * 100))
                    )}%`,
                  }}
                />
              )}
              {line.egresos !== undefined && line.egresos > 0 && (
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(10, Math.round(((line.egresos || 0) / (line.ingresos + (line.egresos || 0) || 1)) * 100))
                    )}%`,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
