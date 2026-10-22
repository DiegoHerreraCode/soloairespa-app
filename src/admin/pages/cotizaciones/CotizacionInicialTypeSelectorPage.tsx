import { Link } from 'react-router';
import { ArrowRight, FileText, ArrowLeft, Receipt } from 'lucide-react';

export const CotizacionInicialTypeSelectorPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            Crear Cotización Inicial
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Seleccione el tipo de cotización inicial que desea crear.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/cotizaciones/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      {/* Cards de Navegación según el boceto: 3 cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl pt-4">
        {/* Card 1: Crear cotizacion inicial de venta */}
        <Link
          to="/admin/cotizaciones/new/inicial/venta"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono representativo */}
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Receipt className="w-11 h-11 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Crear Cotización Inicial de Venta
            </h2>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Crear cotizacion inicial de reparacion */}
        <Link
          to="/admin/cotizaciones/new/inicial/reparacion"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono representativo */}
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Receipt className="w-11 h-11 text-blue-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Crear Cotización Inicial de Reparación
            </h2>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 3: Crear cotizacion inicial de recambio */}
        <Link
          to="/admin/cotizaciones/new/inicial/recambio"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono representativo */}
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Receipt className="w-11 h-11 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Crear Cotización Inicial de Recambio
            </h2>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default CotizacionInicialTypeSelectorPage;
