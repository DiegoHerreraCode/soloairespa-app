import { Link } from 'react-router';
import { ArrowLeft, Wrench } from 'lucide-react';

export const PersonalTallerPage = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Botón Volver y Título */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/personal"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-500" />
            Listado de Personal del Taller
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestión técnica y operarios mediante PersonalController
          </p>
        </div>
      </div>

      {/* Contenedor preparado para la tabla / acciones CRUD */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
        <p className="text-sm text-muted-foreground">
          Aquí implementaremos la tabla de personal del taller (técnicos, mecánicos, estados y acciones).
        </p>
      </div>
    </div>
  );
};

export default PersonalTallerPage;
