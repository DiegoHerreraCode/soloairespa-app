import { Link } from 'react-router';
import { Wrench, ShieldCheck, ArrowRight } from 'lucide-react';

export const PersonalMenuPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Personal y Administradores
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control de personal con AdminController y PersonalController.
        </p>
      </div>

      {/* Cards de Navegación según el boceto */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl pt-4">
        {/* Card 1: Personal del Taller */}
        <Link
          to="/admin/personal/taller"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Wrench className="w-12 h-12 text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Ver Listado de Personal del Taller
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Técnicos, mecánicos y operarios encargados de reparaciones
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Administradores del Sistema */}
        <Link
          to="/admin/personal/administradores"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-purple-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-purple-500/10 border-2 border-purple-500/20 group-hover:border-purple-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <ShieldCheck className="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-purple-500 transition-colors">
              Ver Listado de Administradores del Sistema
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Usuarios con privilegios administrativos y gestión de plataforma
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default PersonalMenuPage;
