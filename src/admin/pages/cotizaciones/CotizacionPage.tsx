import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { useCotizaciones } from '../../hooks/useCotizaciones';
import { aceptarCotizacionAction } from '../../actions/aceptar-cotizacion.action';
import { rechazarCotizacionAction } from '../../actions/rechazar-cotizacion.action';
import { anularCotizacionAction } from '../../actions/anular-cotizacion.action';
import type { CotizacionItem } from '../../interfaces/cotizacion.interface';

export const CotizacionPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cotizaciones, tiposOrdenes, isLoading } = useCotizaciones();

  // Estados de filtros (fiel al boceto: num_cotizacion, tipo de orden, tipo, estado, fecha desde y fecha hasta)
  const [numCotizacionFilter, setNumCotizacionFilter] = useState('');
  const [tipoOrdenFilter, setTipoOrdenFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de tipos de ordenes por id para resolución rápida
  const tiposOrdenesMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((t) => map.set(t.id_tipo_orden, t.nombre));
    return map;
  }, [tiposOrdenes]);

  // Modal para anular cotización (ingreso de motivo)
  const [cotizacionParaAnular, setCotizacionParaAnular] = useState<CotizacionItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // 1. Mutación Rechazar Cotización
  const rechazarMutation = useMutation({
    mutationFn: (id: number) => rechazarCotizacionAction(id),
    onSuccess: (_, id) => {
      toast.success(`Cotización #${id} rechazada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al rechazar la cotización';
      toast.error(msg);
    },
  });

  // 2. Mutación Anular Cotización
  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      anularCotizacionAction(id, motivo),
    onSuccess: (_, variables) => {
      toast.success(`Cotización #${variables.id} anulada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      setCotizacionParaAnular(null);
      setMotivoAnulacion('');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al anular la cotización';
      toast.error(msg);
    },
  });

  // 3. Mutación Aceptar Cotización (Solo para casos directos como tipo Extra de reparación)
  const aceptarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: Record<string, any> }) =>
      aceptarCotizacionAction(id, payload),
    onSuccess: (_, variables) => {
      toast.success(`Cotización #${variables.id} aceptada exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al aceptar la cotización';
      toast.error(msg);
    },
  });

  // Manejador del botón Aceptar
  const handleAceptarClick = (cot: CotizacionItem) => {
    // Si es tipo 'extra' de reparación, el backend no requiere payload adicional
    if (cot.tipo === 'extra') {
      if (confirm(`¿Estás seguro de que deseas aceptar la cotización extra ${cot.num_cotizacion}? Los insumos y servicios se sumarán a la reparación.`)) {
        aceptarMutation.mutate({ id: cot.id_cotizacion });
      }
      return;
    }

    // Para cotizaciones iniciales (Venta, Recambio, Reparación), se requiere ingresar datos de seriales/repuestos
    // Se redirige al componente dedicado de aceptación
    navigate(`/admin/cotizaciones/${cot.id_cotizacion}/aceptar`);
  };

  // Manejador del botón Rechazar
  const handleRechazarClick = (cot: CotizacionItem) => {
    if (confirm(`¿Estás seguro de que deseas marcar como RECHAZADA la cotización ${cot.num_cotizacion}?`)) {
      rechazarMutation.mutate(cot.id_cotizacion);
    }
  };

  // Manejador del botón Anular
  const handleAbrirModalAnular = (cot: CotizacionItem) => {
    setCotizacionParaAnular(cot);
    setMotivoAnulacion('');
  };

  const handleConfirmarAnular = () => {
    if (!cotizacionParaAnular) return;
    if (!motivoAnulacion.trim()) {
      toast.warning('Debes ingresar el motivo de anulación');
      return;
    }
    anularMutation.mutate({
      id: cotizacionParaAnular.id_cotizacion,
      motivo: motivoAnulacion.trim(),
    });
  };

  // Ver Detalle (PDF en nueva pestaña)
  const handleVerDetallePDF = (cot: CotizacionItem) => {
    if (!cot.pdf_cotizacion) {
      toast.error('Esta cotización no tiene un archivo PDF generado asociado');
      return;
    }
    const baseUrlStorage = import.meta.env.VITE_IMG_URL || 'http://localhost:8000/storage';
    const pdfUrl = cot.pdf_cotizacion.startsWith('http')
      ? cot.pdf_cotizacion
      : `${baseUrlStorage}/${cot.pdf_cotizacion.replace(/^\/+/, '')}`;

    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // Filtrado de Cotizaciones
  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter((cot: CotizacionItem) => {
      // 1. Filtro por num_cotizacion
      if (numCotizacionFilter.trim()) {
        const queryNum = numCotizacionFilter.toLowerCase().trim();
        if (!cot.num_cotizacion.toLowerCase().includes(queryNum)) {
          return false;
        }
      }

      // 2. Filtro por tipo de orden
      if (tipoOrdenFilter !== 'all') {
        const nombreTipo = (
          cot.tipo_orden?.nombre ||
          tiposOrdenesMap.get(cot.id_tipo_orden) ||
          ''
        ).toLowerCase();
        if (nombreTipo !== tipoOrdenFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Filtro por tipo (inicial / extra)
      if (tipoFilter !== 'all' && cot.tipo !== tipoFilter) {
        return false;
      }

      // 4. Filtro por estado (pendiente, aceptada, rechazada, anulada)
      if (estadoFilter !== 'all' && cot.estado !== estadoFilter) {
        return false;
      }

      // 5. Filtro por fechas (comparando con fecha_creacion)
      const fechaLimpia = cot.fecha_creacion
        ? cot.fecha_creacion.split('T')[0].split(' ')[0]
        : '';

      if (fechaDesde && (!fechaLimpia || fechaLimpia < fechaDesde)) {
        return false;
      }
      if (fechaHasta && (!fechaLimpia || fechaLimpia > fechaHasta)) {
        return false;
      }

      return true;
    });
  }, [
    cotizaciones,
    numCotizacionFilter,
    tipoOrdenFilter,
    tipoFilter,
    estadoFilter,
    fechaDesde,
    fechaHasta,
    tiposOrdenesMap,
  ]);

  // Cálculo de paginación (máximo 7 filas por página)
  const totalPages = Math.ceil(filteredCotizaciones.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCotizaciones = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredCotizaciones.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCotizaciones, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nueva */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            Listado de Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Presupuestos comerciales de venta, recambio y reparaciones de taller
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/cotizaciones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/cotizaciones/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (num_cotizacion, tipo de orden, tipo, estado, fecha desde y fecha hasta) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Filtro por num_cotizacion */}
          <div>
            <input
              type="text"
              value={numCotizacionFilter}
              onChange={(e) => {
                setNumCotizacionFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por num_cotizacion..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Filtro por Tipo de Orden (Venta, Recambio, Reparación) */}
          <div>
            <select
              value={tipoOrdenFilter}
              onChange={(e) => {
                setTipoOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Tipo de Orden: Todos</option>
              <option value="venta">Venta</option>
              <option value="reparacion">Reparación</option>
              <option value="recambio">Recambio</option>
            </select>
          </div>

          {/* Filtro por Tipo (Inicial / Extra) */}
          <div>
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Tipo: Todos</option>
              <option value="inicial">Inicial</option>
              <option value="extra">Extra</option>
            </select>
          </div>

          {/* Filtro por Estado (Pendiente, Aceptada, Rechazada, Anulada) */}
          <div>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
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

      {/* 3. TABLA DE COTIZACIONES (fiel al boceto: num_cotizacion, tipo de orden, tipo, fecha_creacion, fecha_vencimiento, estado, acciones) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">num_cotizacion</th>
                <th className="py-3 px-4 text-center">tipo de orden</th>
                <th className="py-3 px-4 text-center">tipo</th>
                <th className="py-3 px-4">fecha_creacion</th>
                <th className="py-3 px-4">fecha_vencimiento</th>
                <th className="py-3 px-4 text-center">estado</th>
                <th className="py-3 px-4 text-center">acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      <span>Cargando cotizaciones...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCotizaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No se encontraron cotizaciones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedCotizaciones.map((cot: CotizacionItem) => {
                  const nombreTipoOrden = (
                    cot.tipo_orden?.nombre ||
                    tiposOrdenesMap.get(cot.id_tipo_orden) ||
                    '-'
                  ).toLowerCase();

                  const isPendiente = cot.estado === 'pendiente';

                  return (
                    <tr key={cot.id_cotizacion} className="hover:bg-accent/40 transition-colors">
                      {/* num_cotizacion */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {cot.num_cotizacion}
                      </td>

                      {/* tipo de orden */}
                      <td className="py-3.5 px-4 text-center font-medium capitalize">
                        {nombreTipoOrden}
                      </td>

                      {/* tipo (inicial / extra) */}
                      <td className="py-3.5 px-4 text-center">
                        {cot.tipo === 'inicial' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            inicial
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            extra
                          </span>
                        )}
                      </td>

                      {/* fecha_creacion */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {cot.fecha_creacion}
                      </td>

                      {/* fecha_vencimiento */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {cot.fecha_vencimiento}
                      </td>

                      {/* estado (pendiente, aceptada, rechazada, anulada) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {cot.estado === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            pendiente
                          </span>
                        ) : cot.estado === 'aceptada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            aceptada
                          </span>
                        ) : cot.estado === 'rechazada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            rechazada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                            <Ban className="w-3.5 h-3.5" />
                            anulada
                          </span>
                        )}
                      </td>

                      {/* acciones: [Aceptar] [Rechazar] [Anular] (solo si pendiente) + [Ver Detalle] (siempre) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPendiente && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAceptarClick(cot)}
                                disabled={aceptarMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                title="Aceptar cotización"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aceptar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRechazarClick(cot)}
                                disabled={rechazarMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                title="Rechazar cotización"
                              >
                                <X className="w-3.5 h-3.5" />
                                Rechazar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAbrirModalAnular(cot)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                                title="Anular cotización"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Anular
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleVerDetallePDF(cot)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="Ver Detalle (PDF)"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-blue-500" />
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-xl transition-all cursor-pointer ${validCurrentPage === page
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-card border border-border/80 text-foreground hover:bg-accent'
                }`}
            >
              {page}
            </button>
          ))}

          <button
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* MODAL: Anular Cotización */}
      {cotizacionParaAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/80 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                Anular Cotización {cotizacionParaAnular.num_cotizacion}
              </h3>
              <button
                type="button"
                onClick={() => setCotizacionParaAnular(null)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-muted-foreground">
                Por favor ingresa el motivo por el cual deseas anular esta cotización:
              </p>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                rows={3}
                placeholder="Escribe el motivo de la anulación..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setCotizacionParaAnular(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAnular}
                disabled={anularMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {anularMutation.isPending ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CotizacionPage;
