import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Eye,
  CheckCircle,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useReparaciones } from '../../hooks/useReparaciones';
import { finalizarReparacionAction } from '../../actions/finalizar-reparacion.action';
import type { ReparacionItem } from '../../interfaces/reparacion.interface';

export const ReparacionPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { reparaciones, repuestos, isLoading } = useReparaciones();

  // Opciones de filtrado por id_orden, asociación a orden, estado, fecha desde y fecha hasta
  const [idOrdenFilter, setIdOrdenFilter] = useState('');
  const [ordenAsociadaFilter, setOrdenAsociadaFilter] = useState<'all' | 'con_orden' | 'sin_orden'>('all');
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada'>('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de repuestos por id_repuesto para resolver el service_tag
  const repuestosMap = useMemo(() => {
    const map = new Map<number, (typeof repuestos)[0]>();
    repuestos.forEach((r) => map.set(r.id_repuesto, r));
    return map;
  }, [repuestos]);

  // Mutación para finalizar reparación
  const finalizarMutation = useMutation({
    mutationFn: (id_reparacion: number) => finalizarReparacionAction(id_reparacion),
    onSuccess: (_, id) => {
      toast.success(`Reparación #${id} finalizada con éxito`);
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey][0];
        toast.error(firstMsg);
        return;
      }
      const msg = error.response?.data?.message || 'Error al finalizar la reparación';
      toast.error(msg);
    },
  });

  const handleFinalizar = (id_reparacion: number) => {
    if (confirm(`¿Estás seguro de que deseas marcar como finalizada la reparación #${id_reparacion}?`)) {
      finalizarMutation.mutate(id_reparacion);
    }
  };

  // Filtrado de reparaciones
  const filteredReparaciones = useMemo(() => {
    return reparaciones.filter((rep: ReparacionItem) => {
      // 1. Filtro por id_orden escrito
      if (idOrdenFilter.trim()) {
        const queryOrden = idOrdenFilter.trim();
        if (!rep.id_orden || !String(rep.id_orden).includes(queryOrden)) {
          return false;
        }
      }

      // 2. Filtro por asociación a orden (Consideración 6)
      if (ordenAsociadaFilter === 'con_orden' && !rep.id_orden) {
        return false;
      }
      if (ordenAsociadaFilter === 'sin_orden' && rep.id_orden) {
        return false;
      }

      // 3. Filtro por estado
      if (estadoFilter !== 'all' && rep.estado !== estadoFilter) {
        return false;
      }

      // 4. Filtro por fechas (comparando con fecha_inicio de la reparación)
      const fechaLimpia = rep.fecha_inicio
        ? rep.fecha_inicio.split('T')[0].split(' ')[0]
        : '';

      if (fechaDesde && !fechaLimpia) {
        return false;
      }

      if (fechaDesde && fechaLimpia && fechaLimpia < fechaDesde) {
        return false;
      }
      if (fechaHasta && fechaLimpia && fechaLimpia > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [reparaciones, idOrdenFilter, ordenAsociadaFilter, estadoFilter, fechaDesde, fechaHasta]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredReparaciones.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReparaciones = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredReparaciones.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReparaciones, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Reparaciones
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Control de labores técnicas, insumos y estado de reacondicionamiento
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/taller"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/taller/reparaciones/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (id_orden, estado, fecha desde y fecha hasta) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Filtro por id_orden */}
          <div>
            <input
              type="number"
              min={1}
              value={idOrdenFilter}
              onChange={(e) => {
                setIdOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por id_orden..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Filtro por asociación a orden (Consideración 6) */}
          <div>
            <select
              value={ordenAsociadaFilter}
              onChange={(e) => {
                setOrdenAsociadaFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Órdenes: Todas</option>
              <option value="con_orden">Solo asociadas a una orden</option>
              <option value="sin_orden">Solo no asociadas</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="finalizada">Finalizada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div className="flex items-center gap-2 bg-background/50 border border-border/80 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm bg-transparent text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex items-center gap-2 bg-background/50 border border-border/80 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm bg-transparent text-foreground focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE REPARACIONES */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">id_orden</th>
                <th className="py-3 px-4">service_tag</th>
                <th className="py-3 px-4 text-center">estado</th>
                <th className="py-3 px-4">fecha inicio</th>
                <th className="py-3 px-4">fecha fin</th>
                <th className="py-3 px-4 text-center">acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de reparaciones...
                    </div>
                  </td>
                </tr>
              ) : paginatedReparaciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron reparaciones con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedReparaciones.map((reparacion: ReparacionItem) => {
                  const repuestoAsociado = repuestosMap.get(reparacion.id_repuesto);
                  const serviceTag = repuestoAsociado?.service_tag || (repuestoAsociado?.serial ? `Serial: ${repuestoAsociado.serial}` : 'N/A');
                  const isEnProceso = reparacion.estado === 'en_proceso';

                  return (
                    <tr
                      key={reparacion.id_reparacion}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_orden */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {reparacion.id_orden ? (
                          <span>{reparacion.id_orden}</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">-</span>
                        )}
                      </td>

                      {/* service_tag */}
                      <td className="py-3.5 px-4 font-mono text-foreground font-semibold">
                        {serviceTag}
                      </td>

                      {/* estado */}
                      <td className="py-3.5 px-4 text-center">
                        {reparacion.estado === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            pendiente
                          </span>
                        ) : reparacion.estado === 'en_proceso' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <AlertCircle className="w-3 h-3" />
                            en proceso
                          </span>
                        ) : reparacion.estado === 'finalizada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            finalizada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            anulada
                          </span>
                        )}
                      </td>

                      {/* fecha inicio */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {reparacion.fecha_inicio || '-'}
                      </td>

                      {/* fecha fin */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {reparacion.fecha_fin || '-'}
                      </td>

                      {/* acciones: Finalizar (solo si en_proceso) + Ver Detalle (siempre) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEnProceso && (
                            <button
                              onClick={() => handleFinalizar(reparacion.id_reparacion)}
                              disabled={finalizarMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Finalizar
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/taller/reparaciones/${reparacion.id_reparacion}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            Ver Detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PAGINACIÓN (Anterior, 1, 2, ..., Siguiente) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${validCurrentPage === pageNum
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card border border-border/80 text-foreground hover:bg-accent'
                }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default ReparacionPage;
