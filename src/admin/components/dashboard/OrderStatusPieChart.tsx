interface PieSegment {
  label: string;
  count: number;
  color: string;
  bgDot: string;
}

interface Props {
  title: string;
  data: {
    en_espera: number;
    en_proceso: number;
    finalizada: number;
    anulada: number;
  };
}

export const OrderStatusPieChart = ({ title, data }: Props) => {
  const segments: PieSegment[] = [
    { label: 'En Espera', count: data.en_espera, color: '#f59e0b', bgDot: 'bg-amber-500' },
    { label: 'En Proceso', count: data.en_proceso, color: '#3b82f6', bgDot: 'bg-blue-500' },
    { label: 'Finalizada', count: data.finalizada, color: '#10b981', bgDot: 'bg-emerald-500' },
    { label: 'Anulada', count: data.anulada, color: '#ef4444', bgDot: 'bg-rose-500' },
  ];

  const totalCount = segments.reduce((sum, s) => sum + s.count, 0);

  // Generar trazos SVG basados en ángulos acumulados
  let accumulatedAngle = 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Distribución cuantitativa de estados operativos
        </p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* Gráfico Donut/Pie con SVG nativo */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {totalCount === 0 ? (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="24"
                className="text-muted/40"
              />
            ) : (
              segments.map((seg, i) => {
                const ratio = seg.count / totalCount;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedAngle * circumference;
                accumulatedAngle += ratio;

                if (seg.count === 0) return null;

                return (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="24"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                  />
                );
              })
            )}
          </svg>

          {/* Centro del donut con total absoluto */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-foreground">{totalCount}</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Órdenes
            </span>
          </div>
        </div>

        {/* Leyenda con valores numéricos absolutos (no porcentajes) */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 w-full max-w-xs">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${seg.bgDot}`} />
                <span className="text-muted-foreground">{seg.label}</span>
              </div>
              <span className="font-bold text-foreground text-sm ml-2">
                {seg.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
