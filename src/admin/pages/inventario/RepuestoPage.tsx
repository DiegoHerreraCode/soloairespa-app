import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Filter,
  Eye,
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useRepuestos } from '../../hooks/useRepuestos';
import type { RepuestoItem } from '../../interfaces/repuesto.interface';

export const RepuestoPage = () => {
  const navigate = useNavigate();
  const { repuestos, inventario, ordenes, isLoading } = useRepuestos();

  // Opciones de filtrado: sku, serial, service_tag, estado y propietario
  const [skuFilter, setSkuFilter] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [serviceTagFilter, setServiceTagFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'nuevo' | 'reparado' | 'pendiente_reparacion'>('all');
  const [propietarioFilter, setPropietarioFilter] = useState<'all' | 'taller' | 'cliente'>('all');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de ítems de inventario por id_inventario para resolver SKU y Nombre
  const inventarioMap = useMemo(() => {
    const map = new Map<number, (typeof inventario)[0]>();
    inventario.forEach((inv) => map.set(inv.id_inventario, inv));
    return map;
  }, [inventario]);

  // Mapa de órdenes por id_orden para verificar estados operativos (ej. anulada)
  const ordenesMap = useMemo(() => {
    const map = new Map<number, (typeof ordenes)[0]>();
    ordenes.forEach((o) => map.set(o.id_orden, o));
    return map;
  }, [ordenes]);

  // Filtrado de repuestos
  const filteredRepuestos = useMemo(() => {
    return repuestos.filter((r: RepuestoItem) => {
      const itemInv = inventarioMap.get(r.id_inventario);
      const sku = (itemInv?.sku || '').toLowerCase();
      const serial = (r.serial || '').toLowerCase();
      const serviceTag = (r.service_tag || '').toLowerCase();

      // 1. Filtro por SKU
      if (skuFilter.trim() && !sku.includes(skuFilter.trim().toLowerCase())) {
        return false;
      }

      // 2. Filtro por serial
      if (serialFilter.trim() && !serial.includes(serialFilter.trim().toLowerCase())) {
        return false;
      }

      // 3. Filtro por service_tag
      if (serviceTagFilter.trim() && !serviceTag.includes(serviceTagFilter.trim().toLowerCase())) {
        return false;
      }

      // 4. Filtro por estado
      if (estadoFilter !== 'all' && r.estado !== estadoFilter) {
        return false;
      }

      // 5. Filtro por propietario (true / '1' / 'taller' vs false / '0' / 'cliente')
      if (propietarioFilter !== 'all') {
        const isTaller = r.propietario === true || String(r.propietario) === '1';
        if (propietarioFilter === 'taller' && !isTaller) return false;
        if (propietarioFilter === 'cliente' && isTaller) return false;
      }

      return true;
    });
  }, [repuestos, inventarioMap, skuFilter, serialFilter, serviceTagFilter, estadoFilter, propietarioFilter]);

  // Ordenar el arreglo filteredRepuestos por el campo id_repuesto de forma descendente
  filteredRepuestos.sort((a: RepuestoItem, b: RepuestoItem) => {
    if (a.id_repuesto < b.id_repuesto) return 1;
    if (a.id_repuesto > b.id_repuesto) return -1;
    return 0;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredRepuestos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRepuestos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredRepuestos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRepuestos, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Repuestos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Piezas físicas serializadas, estados técnicos y trazabilidad
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/inventario"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (sku, serial, service_tag, estado y propietario) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Filtro por SKU */}
          <div>
            <input
              type="text"
              value={skuFilter}
              onChange={(e) => {
                setSkuFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por SKU..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Filtro por Serial */}
          <div>
            <input
              type="text"
              value={serialFilter}
              onChange={(e) => {
                setSerialFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por serial..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Service Tag */}
          <div>
            <input
              type="text"
              value={serviceTagFilter}
              onChange={(e) => {
                setServiceTagFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por service tag..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Estado: Todos</option>
              <option value="nuevo">Nuevo</option>
              <option value="reparado">Reparado</option>
              <option value="pendiente_reparacion">Pendiente Reparación</option>
            </select>
          </div>

          {/* Filtro por Propietario */}
          <div>
            <select
              value={propietarioFilter}
              onChange={(e) => {
                setPropietarioFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Propietario: Todos</option>
              <option value="taller">Taller (Propio)</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE REPUESTOS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">sku</th>
                <th className="py-3 px-4">serial</th>
                <th className="py-3 px-4">service tag</th>
                <th className="py-3 px-4 text-center">estado</th>
                <th className="py-3 px-4 text-center">propietario</th>
                <th className="py-3 px-4 text-right">orden de entrada</th>
                <th className="py-3 px-4 text-right">orden de salida</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de repuestos...
                    </div>
                  </td>
                </tr>
              ) : paginatedRepuestos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron repuestos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRepuestos.map((repuesto: RepuestoItem) => {
                  const itemInv = inventarioMap.get(repuesto.id_inventario);
                  const isTaller = repuesto.propietario === true || String(repuesto.propietario) === '1';

                  return (
                    <tr
                      key={repuesto.id_repuesto}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* sku */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {itemInv?.sku || 'N/A'}
                      </td>

                      {/* serial */}
                      <td className="py-3.5 px-4 font-mono text-foreground font-semibold">
                        {repuesto.serial || 'Sin serial'}
                      </td>

                      {/* service tag */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                        {repuesto.service_tag || 'N/A'}
                      </td>

                      {/* estado */}
                      <td className="py-3.5 px-4 text-center">
                        {repuesto.estado === 'nuevo' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            nuevo
                          </span>
                        ) : repuesto.estado === 'reparado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            reparado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            pendiente reparación
                          </span>
                        )}
                      </td>

                      {/* propietario */}
                      <td className="py-3.5 px-4 text-center">
                        {isTaller ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            Taller
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                            <User className="w-3 h-3" />
                            Cliente
                          </span>
                        )}
                      </td>

                      {/* orden de entrada */}
                      <td className="py-3.5 px-4 text-right">
                        {repuesto.id_orden_entrada ? (
                          (() => {
                            const ordenEntrada = ordenesMap.get(repuesto.id_orden_entrada);
                            const isAnulada = ordenEntrada?.estado_operativo === 'anulada';
                            return (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span className={`font-semibold ${isAnulada ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {repuesto.id_orden_entrada}
                                </span>
                                {isAnulada && (
                                  <span
                                    title="Esta orden de entrada se encuentra anulada"
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  >
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Anulada
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* orden de salida */}
                      <td className="py-3.5 px-4 text-right font-bold text-foreground">
                        {repuesto.id_orden_salida || '-'}
                      </td>

                      {/* Acciones: Ver Detalle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/inventario/repuestos/${repuesto.id_repuesto}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          Ver Detalle
                        </button>
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

export default RepuestoPage;
