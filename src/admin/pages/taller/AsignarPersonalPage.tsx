import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  XCircle,
  Search,
  Users,
  Check,
} from 'lucide-react';
import { getReparacionByIdAction } from '../../actions/get-reparacion-by-id.action';
import { getReparacionesServiciosTallerAction } from '../../actions/get-reparaciones-servicios-taller.action';
import { getServiciosTallerAction } from '../../actions/get-servicios-taller.action';
import { getPersonalAction } from '../../actions/get-personal.action';
import { useAsignacionMutation } from '../../hooks/useAsignacionMutation';
import type { PersonalItem } from '../../interfaces/personal.interface';

export const AsignarPersonalPage = () => {
  const { idReparacion, idReparacionServicio } = useParams<{
    idReparacion: string;
    idReparacionServicio: string;
  }>();

  const idRepServicioNum = Number(idReparacionServicio);

  // 1. Consultas de datos
  const { data: reparacion, isLoading: isLoadingReparacion } = useQuery({
    queryKey: ['reparacion-item', idReparacion],
    queryFn: () => getReparacionByIdAction(idReparacion!),
    enabled: !!idReparacion,
  });

  const { data: repServicios = [] } = useQuery({
    queryKey: ['reparaciones-servicios-taller'],
    queryFn: getReparacionesServiciosTallerAction,
  });

  const { data: catalogoServicios = [] } = useQuery({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
  });

  const { data: personalList = [], isLoading: isLoadingPersonal } = useQuery({
    queryKey: ['personal-listado'],
    queryFn: getPersonalAction,
  });

  // 2. Resolver el servicio actual
  const currentRepServicio = useMemo(() => {
    if (reparacion?.servicios_taller) {
      const encontrado = reparacion.servicios_taller.find(
        (s) => Number(s.id_reparacion_servicio_taller) === idRepServicioNum
      );
      if (encontrado) return encontrado;
    }
    return repServicios.find(
      (s) => Number(s.id_reparacion_servicio_taller) === idRepServicioNum
    );
  }, [reparacion, repServicios, idRepServicioNum]);

  const nombreServicio = useMemo(() => {
    if (currentRepServicio?.servicio_taller?.nombre) {
      return currentRepServicio.servicio_taller.nombre;
    }
    const cat = catalogoServicios.find(
      (c) => c.id_servicio_taller === currentRepServicio?.id_servicio_taller
    );
    return cat?.nombre || `Servicio #${idRepServicioNum}`;
  }, [currentRepServicio, catalogoServicios, idRepServicioNum]);

  // 3. Estado local de personal seleccionado para guardar (proceso de única vez)
  interface EmpleadoSeleccionado {
    id_personal: number;
    nombre: string;
    rut: string;
  }

  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<EmpleadoSeleccionado[]>([]);
  const [busquedaNombre, setBusquedaNombre] = useState('');

  // 4. Filtrado de empleados en el sidebar lateral
  const empleadosDisponibles = useMemo(() => {
    const term = busquedaNombre.toLowerCase().trim();
    // Excluir eliminados lógicos si aplican
    const activos = personalList.filter((p) => !p.is_deleted);

    return activos.filter((p) => {
      if (!term) return true;
      return (
        p.nombre.toLowerCase().includes(term) ||
        (p.rut && p.rut.toLowerCase().includes(term))
      );
    });
  }, [personalList, busquedaNombre]);

  // Agregar empleado
  const handleAgregarEmpleado = (p: PersonalItem) => {
    const yaExiste = empleadosSeleccionados.some((e) => e.id_personal === p.id_personal);
    if (yaExiste) {
      toast.info('Este empleado ya se encuentra en la lista');
      return;
    }

    setEmpleadosSeleccionados((prev) => [
      ...prev,
      {
        id_personal: p.id_personal,
        nombre: p.nombre,
        rut: p.rut || 'S/RUT',
      },
    ]);
  };

  // Remover empleado
  const handleRemoverEmpleado = (id_personal: number) => {
    setEmpleadosSeleccionados((prev) => prev.filter((e) => e.id_personal !== id_personal));
  };

  // 5. Mutación de guardado sincronizado mediante hook useAsignacionMutation
  const { guardarAsignaciones, isSaving } = useAsignacionMutation();

  const handleGuardar = () => {
    if (empleadosSeleccionados.length === 0) {
      toast.warning('Debes seleccionar al menos un empleado para asignar a este servicio');
      return;
    }

    guardarAsignaciones({
      idReparacion: idReparacion!,
      idRepServicioNum,
      empleadosSeleccionados,
    });
  };

  const isLoading = isLoadingReparacion || isLoadingPersonal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. BARRA SUPERIOR: Título fiel al boceto + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Asignar Personal al Servicio &ldquo;{nombreServicio}&rdquo; de la Reparacion #{idReparacion}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Selecciona el personal técnico responsable de ejecutar este servicio
          </p>
        </div>

        <Link
          to={`/admin/taller/reparaciones/${idReparacion}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      {/* 2. SECCIÓN PRINCIPAL: LISTA DE EMPLEADOS SELECCIONADOS + SIDEBAR DE BÚSQUEDA */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Lista de Empleados Seleccionados
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Tabla de Empleados Seleccionados (Boceto: nombre personal, rut personal, botón quitar) */}
          <div className="lg:col-span-8 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-4 text-center">nombre (personal)</th>
                    <th className="py-2.5 px-4 text-center">rut (personal)</th>
                    <th className="py-2.5 px-4 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {empleadosSeleccionados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground text-xs">
                        No hay empleados seleccionados todavía. Puedes agregarlos desde el buscador lateral.
                      </td>
                    </tr>
                  ) : (
                    empleadosSeleccionados.map((emp) => (
                      <tr key={emp.id_personal} className="hover:bg-accent/40 transition-colors text-center">
                        <td className="py-3 px-4 font-semibold text-foreground text-xs sm:text-sm">
                          {emp.nombre}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground text-xs sm:text-sm">
                          {emp.rut}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoverEmpleado(emp.id_personal)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title="Quitar empleado"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar lateral: Buscar por nombre (Boceto: input Buscar por nombre, lista con nombre/rut y botón +) */}
          <div className="lg:col-span-4 bg-card rounded-2xl border border-border/80 p-4 space-y-3 shadow-xs">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground block">Buscar por nombre</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={busquedaNombre}
                  onChange={(e) => setBusquedaNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const disponible = empleadosDisponibles.find(
                        (p) => !empleadosSeleccionados.some((emp) => emp.id_personal === p.id_personal)
                      );
                      if (disponible) {
                        handleAgregarEmpleado(disponible);
                      } else if (empleadosDisponibles.length > 0) {
                        toast.info('Los empleados encontrados ya están en la lista');
                      }
                    }
                  }}
                  placeholder="Filtrar empleado..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
              {empleadosDisponibles.slice(0, 20).map((personal) => {
                const yaSeleccionado = empleadosSeleccionados.some(
                  (e) => e.id_personal === personal.id_personal
                );

                return (
                  <div
                    key={personal.id_personal}
                    className="pt-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <span
                        className={`font-semibold block truncate ${yaSeleccionado ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}
                      >
                        {personal.nombre}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {personal.rut || 'Sin RUT'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAgregarEmpleado(personal)}
                      disabled={yaSeleccionado}
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        }`}
                      title={yaSeleccionado ? 'Ya seleccionado' : 'Agregar empleado'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTÓN PRINCIPAL: GUARDAR (Fiel al boceto: centrado/destacado abajo) */}
      <div className="flex justify-center pt-6 border-t border-border/80">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={isSaving}
          className="px-10 py-3.5 text-sm sm:text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Guardar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AsignarPersonalPage;
