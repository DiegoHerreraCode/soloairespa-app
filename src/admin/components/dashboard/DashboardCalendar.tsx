import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  highlightedDates: string[]; // Formato YYYY-MM-DD
  tooltipMessage: string;
}

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const DashboardCalendar = ({
  title,
  subtitle,
  highlightedDates,
  tooltipMessage,
}: Props) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Primer día del mes (0: Domingo, 1: Lunes... adaptamos para que la semana empiece en Lunes)
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Convertir las fechas a set para búsqueda instantánea
  const highlightSet = new Set(
    highlightedDates.map((d) => d.split('T')[0])
  );

  // Armar cuadrícula de días
  const calendarCells = [];
  // Celdas vacías al inicio
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Cabecera del Calendario inspirada en la imagen */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="bg-sky-400 dark:bg-sky-600 px-4 py-2.5 flex items-center justify-between text-white font-bold text-sm tracking-wider">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {MONTH_NAMES[month]} &nbsp; {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Encabezado de Días L M M J V S D */}
        <div className="grid grid-cols-7 text-center py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
          {WEEK_DAYS.map((wd, i) => (
            <span key={i}>{wd}</span>
          ))}
        </div>

        {/* Cuadrícula de Números */}
        <div className="grid grid-cols-7 text-center divide-x divide-y divide-border/60 bg-card">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="h-10 bg-muted/10" />;
            }

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isHighlighted = highlightSet.has(dayString);

            return (
              <div
                key={idx}
                title={isHighlighted ? tooltipMessage : undefined}
                className={`h-10 flex items-center justify-center text-xs font-medium transition-colors relative ${
                  isHighlighted
                    ? 'bg-amber-200 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 font-bold'
                    : 'text-foreground hover:bg-muted/40'
                }`}
              >
                <span>{day}</span>
                {isHighlighted && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador / Leyenda explicativa en la parte inferior */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-3.5 h-3.5 rounded-md bg-amber-200 dark:bg-amber-500/30 border border-amber-300 dark:border-amber-500/40 shrink-0" />
        <span className="truncate">{tooltipMessage}</span>
      </div>
    </div>
  );
};
