import { Link } from 'react-router';
import {
  Boxes,
  Bookmark,
  Layers,
  Cpu,
  Wrench,
  ArrowRight,
} from 'lucide-react';

export const InventarioMenuPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Inventario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control maestro de existencias, repuestos serializados, equipos, marcas y modelos.
        </p>
      </div>

      {/* Grid de 5 opciones según boceto */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl pt-2">
        {/* Card 1: Ver Listado de Ítems de Inventario */}
        <Link
          to="/admin/inventario/items"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Boxes className="w-11 h-11 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Ver Listado de Items de Inventario
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Catálogo maestro, existencias totales y precios
            </p>
          </div>

          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Ver Listado de Marcas */}
        <Link
          to="/admin/inventario/marcas"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-emerald-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 group-hover:border-emerald-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Bookmark className="w-11 h-11 text-emerald-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Ver Listado de Marcas
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Registro y control de fabricantes y marcas comerciales
            </p>
          </div>

          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 3: Ver Listado de Modelos */}
        <Link
          to="/admin/inventario/modelos"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-indigo-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Layers className="w-11 h-11 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-indigo-500 transition-colors">
              Ver Listado de Modelos
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Modelos técnicos vinculados a marcas comerciales
            </p>
          </div>

          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 4: Ver Listado de Equipos */}
        <Link
          to="/admin/inventario/equipos"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-amber-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/20 group-hover:border-amber-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Cpu className="w-11 h-11 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors">
              Ver Listado de Equipos
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Equipos serializados y trazabilidad física
            </p>
          </div>

          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 5: Ver Listado de Repuestos */}
        <Link
          to="/admin/inventario/repuestos"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-rose-500/50 rounded-2xl p-7 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/20 group-hover:border-rose-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Wrench className="w-11 h-11 text-rose-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold text-foreground group-hover:text-rose-500 transition-colors">
              Ver Listado de Repuestos
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Piezas físicas serializadas, estados, propiedad y trazabilidad
            </p>
          </div>

          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default InventarioMenuPage;
