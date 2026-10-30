import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Filter,
  Eye,
  Ban,
  X,
  ClipboardList
} from 'lucide-react';
import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { anularOrdenAction } from '../../actions/anular-orden.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { getReparacionesAction } from '../../actions/get-reparaciones.action';
import type { OrdenItem } from '../../interfaces/orden.interface';
import type { ClienteItem } from '../../interfaces/cliente.interface';
import type { TipoOrdenItem } from '../../interfaces/tipo-orden.interface';
import type { ReparacionItem } from '../../interfaces/reparacion.interface';

export const OrdenPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Órdenes y catálogos necesarios
  const { data: ordenes = [], isLoading: isLoadingOrdenes } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: getClientesAction,
  });

  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-select'],
    queryFn: getTiposOrdenesAction,
  });

  const { data: reparaciones = [] } = useQuery({
    queryKey: ['reparaciones-listado'],
    queryFn: getReparacionesAction,
  });

  // Mapas para resolución rápida de datos relacionales
  const clientesMap = useMemo(
    () => new Map(clientes.map((c: ClienteItem) => [c.id_cliente, c])),
    [clientes]
  );

  const tiposOrdenesMap = useMemo(
    () => new Map(tiposOrdenes.map((t: TipoOrdenItem) => [t.id_tipo_orden, t])),
    [tiposOrdenes]
  );

  // Mapa de id_orden -> id_reparacion (para redirigir a DevolverInsumosPage en reparaciones)
  const ordenReparacionMap = useMemo(() => {
    const map = new Map<number, number>();
    reparaciones.forEach((r: ReparacionItem) => {
      if (r.id_orden) {
        map.set(Number(r.id_orden), Number(r.id_reparacion));
      }
    });
    return map;
  }, [reparaciones]);

  // 2. Estados de Filtros según boceto:
  // opciones de filtrado por nombre, rut, id_orden, estado operativo, estado administrativo, fecha desde y fecha hasta
  const [nombreClienteFilter, setNombreClienteFilter] = useState('');
  const [rutClienteFilter, setRutClienteFilter] = useState('');
  const [idOrdenFilter, setIdOrdenFilter] = useState('');
  const [estadoOperativoFilter, setEstadoOperativoFilter] = useState('all');
  const [estadoAdministrativoFilter, setEstadoAdministrativoFilter] = useState('all');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');

  // 3. Paginación: Máximo 7 filas por página
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // 4. Modal para anular orden (Venta o Recambio)
  const [ordenParaAnular, setOrdenParaAnular] = useState<OrdenItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Mutación para anular orden (Venta / Recambio)
  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number | string; motivo: string }) =>
      anularOrdenAction(id, { motivo_anulacion: motivo }),
    onSuccess: (_, variables) => {
      toast.success(`Orden #${variables.id} anulada exitosamente`);
      setOrdenParaAnular(null);
      setMotivoAnulacion('');
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al anular la orden';
      toast.error(msg);
    },
  });

  // Manejador del botón "Anular"
  const handleAnularClick = (orden: OrdenItem) => {
    const tipo = (orden.tipo_orden?.nombre || tiposOrdenesMap.get(orden.id_tipo_orden || 0)?.nombre || '').toLowerCase();

    if (tipo === 'reparacion') {
      // Las órdenes de tipo reparación se anulan mediante DevolverInsumosPage
      const idReparacion = ordenReparacionMap.get(orden.id_orden);
      if (idReparacion) {
        navigate(`/admin/taller/reparaciones/${idReparacion}/devolver-insumos?modo=anular_orden&id_orden=${orden.id_orden}`);
      } else {
        // En caso de que no encontremos el id_reparacion directo, usar id_orden como fallback o alertar
        toast.error(`No se encontró el registro de reparación asociado a la Orden #${orden.id_orden}`);
      }
    } else {
      // Venta o Recambio: Anulación mediante Modal
      setOrdenParaAnular(orden);
      setMotivoAnulacion('');
    }
  };

  const handleConfirmarAnulacionModal = () => {
    if (!ordenParaAnular) return;
    if (!motivoAnulacion.trim()) {
      toast.warning('Por favor ingresa el motivo de la anulación');
      return;
    }
    anularMutation.mutate({
      id: ordenParaAnular.id_orden,
      motivo: motivoAnulacion.trim(),
    });
  };

  // 5. Lógica de Filtrado
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden: OrdenItem) => {
      const cliente = orden.cliente || clientesMap.get(orden.id_cliente || 0);
      const nombreCliente = (cliente?.nombre || '').toLowerCase();
      const rutCliente = (cliente?.rut || '').toLowerCase();
      const idOrdenStr = String(orden.id_orden);

      // Filtro por nombre de cliente
      if (nombreClienteFilter.trim() && !nombreCliente.includes(nombreClienteFilter.trim().toLowerCase())) {
        return false;
      }

      // Filtro por RUT
      if (rutClienteFilter.trim() && !rutCliente.includes(rutClienteFilter.trim().toLowerCase())) {
        return false;
      }

      // Filtro por ID de Orden
      if (idOrdenFilter.trim() && !idOrdenStr.includes(idOrdenFilter.trim())) {
        return false;
      }

      // Filtro por Estado Operativo
      if (estadoOperativoFilter !== 'all' && orden.estado_operativo !== estadoOperativoFilter) {
        return false;
      }

      // Filtro por Estado Administrativo
      if (estadoAdministrativoFilter !== 'all' && orden.estado_administrativo !== estadoAdministrativoFilter) {
        return false;
      }

      // Filtro por Fecha Desde
      if (fechaDesdeFilter) {
        const fechaOrden = orden.fecha_creacion?.split('T')[0] || '';
        if (fechaOrden < fechaDesdeFilter) return false;
      }

      // Filtro por Fecha Hasta
      if (fechaHastaFilter) {
        const fechaOrden = orden.fecha_creacion?.split('T')[0] || '';
        if (fechaOrden > fechaHastaFilter) return false;
      }

      return true;
    });
  }, [
    ordenes,
    clientesMap,
    nombreClienteFilter,
    rutClienteFilter,
    idOrdenFilter,
    estadoOperativoFilter,
    estadoAdministrativoFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
  ]);

  // Ordenar el arreglo FilteredOrdenes por el campo last_update de forma descendente
  filteredOrdenes.sort((a: OrdenItem, b: OrdenItem) => {
    const timeA = a.last_update ? new Date(a.last_update).getTime() : 0;
    const timeB = b.last_update ? new Date(b.last_update).getTime() : 0;
    return timeB - timeA;
  });

  // Cálculo de páginas
  const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrdenes = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredOrdenes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrdenes, validCurrentPage, itemsPerPage]);

  // Formato de moneda
  const formatMoney = (val: string | number | undefined) => {
    return Number(val || 0).toLocaleString('es-CL');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nueva */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Ordenes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro y control de órdenes de trabajo comerciales y de taller
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/ordenes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/ordenes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (Buscador por nombre, rut, id_orden, estado operativo, estado administrativo, fecha desde y fecha hasta) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            Opciones de Filtrado
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Nombre Cliente */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Nombre Cliente
            </label>
            <input
              type="text"
              value={nombreClienteFilter}
              onChange={(e) => {
                setNombreClienteFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Ej: Juan..."
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* RUT Cliente */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              RUT Cliente
            </label>
            <input
              type="text"
              value={rutClienteFilter}
              onChange={(e) => {
                setRutClienteFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Ej: 30433366..."
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* ID Orden */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              ID Orden
            </label>
            <input
              type="text"
              value={idOrdenFilter}
              onChange={(e) => {
                setIdOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Ej: 1"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
            />
          </div>

          {/* Estado Operativo */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Estado Operativo
            </label>
            <select
              value={estadoOperativoFilter}
              onChange={(e) => {
                setEstadoOperativoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">Todos</option>
              <option value="en_espera">En espera</option>
              <option value="en_proceso">En proceso</option>
              <option value="finalizada">Finalizada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          {/* Estado Administrativo */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Estado Admin.
            </label>
            <select
              value={estadoAdministrativoFilter}
              onChange={(e) => {
                setEstadoAdministrativoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">Todos</option>
              <option value="pendiente_pago">Pendiente pago</option>
              <option value="pagada">Pagada</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesdeFilter}
              onChange={(e) => {
                setFechaDesdeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHastaFilter}
              onChange={(e) => {
                setFechaHastaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE ORDENES (Fiel al Boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-3 text-center">id_orden</th>
                <th className="py-3 px-3 text-center">nombre (del cliente)</th>
                <th className="py-3 px-3 text-center">rut (del cliente)</th>
                <th className="py-3 px-3 text-center">tipo de orden</th>
                <th className="py-3 px-3 text-center">fecha entrega reparacion</th>
                <th className="py-3 px-3 text-center">fecha creacion</th>
                <th className="py-3 px-3 text-center">monto total</th>
                <th className="py-3 px-3 text-center">monto pendiente</th>
                <th className="py-3 px-3 text-center">estado operativo</th>
                <th className="py-3 px-3 text-center">estado administrativo</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingOrdenes ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      <span>Cargando listado de órdenes...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron órdenes registradas con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedOrdenes.map((orden: OrdenItem) => {
                  const cliente = orden.cliente || clientesMap.get(orden.id_cliente || 0);
                  const tipo = orden.tipo_orden?.nombre || tiposOrdenesMap.get(orden.id_tipo_orden || 0)?.nombre || 'N/A';

                  // REGLA CLAVE DEL BOCETO:
                  // "El boton de 'Anular' solo sale si el estado_administrativo = 'pendiente_pago' y estado_operativo != 'anulada'"
                  const puedeAnular =
                    orden.estado_administrativo === 'pendiente_pago' &&
                    orden.estado_operativo !== 'anulada';

                  return (
                    <tr
                      key={orden.id_orden}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_orden */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                        {orden.id_orden}
                      </td>

                      {/* nombre (del cliente) */}
                      <td className="py-3 px-3 font-medium text-foreground text-center">
                        {cliente?.nombre || '-'}
                      </td>

                      {/* rut (del cliente) */}
                      <td className="py-3 px-3 font-mono text-muted-foreground text-center">
                        {cliente?.rut || '-'}
                      </td>

                      {/* tipo de orden */}
                      <td className="py-3 px-3 text-center">
                        <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {tipo}
                        </span>
                      </td>

                      {/* fecha entrega reparacion */}
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                        {orden.fecha_entrega_reparacion
                          ? orden.fecha_entrega_reparacion.split('T')[0]
                          : '-'}
                      </td>

                      {/* fecha creacion */}
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                        {orden.fecha_creacion ? orden.fecha_creacion.split('T')[0] : '-'}
                      </td>

                      {/* monto total */}
                      <td className="py-3 px-3 text-center font-bold text-foreground font-mono">
                        ${formatMoney(orden.monto_total)}
                      </td>

                      {/* monto pendiente */}
                      <td className="py-3 px-3 text-center font-bold font-mono text-rose-600 dark:text-rose-400">
                        ${formatMoney(orden.monto_pendiente ?? 0)}
                      </td>

                      {/* estado operativo */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${orden.estado_operativo === 'finalizada'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : orden.estado_operativo === 'en_proceso'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : orden.estado_operativo === 'anulada'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                        >
                          {orden.estado_operativo}
                        </span>
                      </td>

                      {/* estado administrativo */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${orden.estado_administrativo === 'pagada'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                        >
                          {orden.estado_administrativo?.replace('_', ' ') || 'pendiente'}
                        </span>
                      </td>

                      {/* Acciones: [Anular] (si corresponde) y [Ver Detalle] */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {puedeAnular && (
                            <button
                              type="button"
                              onClick={() => handleAnularClick(orden)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Anular orden"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Anular
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/ordenes/listado/${orden.id_orden}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                            title="Ver Detalle de la Orden"
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
        <div className="flex items-center justify-center gap-2 pt-2">
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

      {/* 5. MODAL: Anular Orden (Para Venta y Recambio) */}
      {ordenParaAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/80 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                Anular Orden #{ordenParaAnular.id_orden}
              </h3>
              <button
                type="button"
                onClick={() => setOrdenParaAnular(null)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-muted-foreground">
                Por favor ingresa el motivo por el cual deseas anular esta orden comercial. Se devolverán los ítems al stock y se cancelarán sus impactos financieros:
              </p>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                rows={3}
                placeholder="Ej: Cliente no pudo realizar el pago..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setOrdenParaAnular(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAnulacionModal}
                disabled={anularMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {anularMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Anulando...</span>
                  </>
                ) : (
                  <span>Confirmar Anulación</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenPage;
