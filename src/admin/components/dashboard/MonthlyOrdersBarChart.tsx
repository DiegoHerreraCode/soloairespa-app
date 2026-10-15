interface BarData {
  month: string;
  total: number;
}

interface Props {
  title: string;
  data: BarData[];
}

export const MonthlyOrdersBarChart = ({ title, data }: Props) => {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cantidad de órdenes registradas por mes
        </p>
      </div>

      {/* Gráfico de barras SVG y HTML */}
      <div className="mt-6 flex items-end justify-between gap-2 h-48 pt-6 pb-2 px-2 border-b border-border/60">
        {data.map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.total / maxTotal) * 100), 6);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              {/* Tooltip con valor */}
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                {item.total}
              </span>

              {/* Barra */}
              <div className="w-full max-w-[36px] bg-muted/60 rounded-t-lg overflow-hidden flex items-end h-full">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-cyan-400 rounded-t-lg transition-all duration-500 ease-out shadow-xs"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Etiqueta del mes */}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
