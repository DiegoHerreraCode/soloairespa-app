import { Link } from 'react-router';
import { Receipt, ArrowRight } from 'lucide-react';

export const CotizacionMenuPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Cotizaciones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de cotizaciones.
        </p>
      </div>

      {/* Cards de Navegación según el boceto */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl pt-4">
        {/* Card 1: Ver Listado de Cotizaciones */}
        <Link
          to="/admin/cotizaciones/listado"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 group-hover:border-emerald-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Receipt className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Ver Listado de Cotizaciones
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Registro de cotizaciones
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default CotizacionMenuPage;
