import { Link } from 'react-router';
import { ShoppingBag, CreditCard, Building2, ArrowRight } from 'lucide-react';

export const CompraMenuPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Compras y Proveedores
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de compras, compromisos de pago y catálogo de proveedores.
        </p>
      </div>

      {/* Cards de Navegación según el boceto: 3 cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl pt-4">
        {/* Card 1: Ver Listado de Compras */}
        <Link
          to="/admin/compras/listado"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono representativo */}
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <ShoppingBag className="w-11 h-11 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Ver Listado de Compras
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Registro de compras de repuestos, insumos y equipos con facturas o boletas
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Ver Listado de Pagos de Compras */}
        <Link
          to="/admin/compras/pagos-compras"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-emerald-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono representativo */}
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 group-hover:border-emerald-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <CreditCard className="w-11 h-11 text-emerald-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Ver Listado de Pagos de Compras
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Control de cuotas acordadas, pagos realizados y saldos pendientes a proveedores
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 3: Ver Listado de Proveedores */}
        <Link
          to="/admin/compras/proveedores"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-indigo-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono representativo */}
          <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Building2 className="w-11 h-11 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-indigo-500 transition-colors">
              Ver Listado de Proveedores
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Catálogo de proveedores comerciales, datos de contacto y facturación
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default CompraMenuPage;
