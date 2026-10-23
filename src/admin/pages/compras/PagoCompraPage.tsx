import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Search,
  Receipt,
  Filter,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { usePagosCompras } from '../../hooks/usePagosCompras';
import type { PagoCompraItem } from '../../interfaces/pago-compra.interface';

export const PagoCompraPage = () => {
  const navigate = useNavigate();
  const { pagosCompras, compras, proveedores, isLoading } = usePagosCompras();

  // Estados de filtrado: nombre, rut, id_compra, estado, fecha desde y fecha hasta
  const [searchTerm, setSearchTerm] = useState('');
  const [idCompraFilter, setIdCompraFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'realizado' | 'pendiente'>('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de Compras por ID para resolver el id_proveedor de cada compra
  const comprasMap = useMemo(() => {
    const map = new Map<number, (typeof compras)[0]>();
    compras.forEach((c) => map.set(c.id_compra, c));
    return map;
  }, [compras]);

  // Mapa de Proveedores por ID para resolver Nombre y RUT
  const proveedoresMap = useMemo(() => {
    const map = new Map<number, (typeof proveedores)[0]>();
    proveedores.forEach((p) => map.set(p.id_proveedor, p));
    return map;
  }, [proveedores]);

  // Filtrado de pagos de compras
  const filteredPagos = useMemo(() => {
    return pagosCompras.filter((p: PagoCompraItem) => {
      const compra = comprasMap.get(p.id_compra);
      const proveedor = compra ? proveedoresMap.get(compra.id_proveedor) : undefined;
      const nombreProveedor = (proveedor?.nombre || '').toLowerCase();
      const rutProveedor = (proveedor?.rut || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      // 1. Filtro de texto: Nombre o RUT del proveedor
      if (term && !nombreProveedor.includes(term) && !rutProveedor.includes(term)) {
        return false;
      }

      // 2. Filtro por id_compra
      if (idCompraFilter.trim() && String(p.id_compra) !== idCompraFilter.trim()) {
        return false;
      }

      // 3. Filtro por estado ('realizado' | 'pendiente')
      if (estadoFilter !== 'all' && p.estado !== estadoFilter) {
        return false;
      }

      // 4. Filtro por fechas (se evalúa fecha_pago si existe, o fecha_pago_acordada)
      const fechaBase = p.fecha_pago_acordada;
      const fechaLimpia = fechaBase ? fechaBase.split('T')[0].split(' ')[0] : '';
      if (fechaDesde && fechaLimpia && fechaLimpia < fechaDesde) {
        return false;
      }
      if (fechaHasta && fechaLimpia && fechaLimpia > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [pagosCompras, comprasMap, proveedoresMap, searchTerm, idCompraFilter, estadoFilter, fechaDesde, fechaHasta]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPagos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredPagos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPagos, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Pagos de Compras
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Control de cuotas y compromisos de pago acordados con proveedores
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/compras"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (nombre, rut, id_compra, estado, fecha desde y fecha hasta) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Buscador de Nombre o RUT del proveedor */}
          <div className="sm:col-span-2 lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre o RUT de proveedor..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por ID de Compra */}
          <div className="lg:col-span-3">
            <input
              type="number"
              value={idCompraFilter}
              onChange={(e) => {
                setIdCompraFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ID Compra..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="lg:col-span-4">
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Estado: Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="realizado">Realizado</option>
            </select>
          </div>

          {/* Rango de Fechas con etiquetas y espacio holgado */}
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row items-center gap-2 bg-background/50 border border-border/60 p-1.5 px-3 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setCurrentPage(1);
              }}
              title="Fecha de pago desde"
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row items-center gap-2 bg-background/50 border border-border/60 p-1.5 px-3 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setCurrentPage(1);
              }}
              title="Fecha de pago hasta"
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE PAGOS DE COMPRAS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 text-center">id_compra</th>
                <th className="py-3 px-4 text-center">nombre (del proveedor)</th>
                <th className="py-3 px-4 text-center">rut (del proveedor)</th>
                <th className="py-3 px-4 text-center">porcentaje monto total (%)</th>
                <th className="py-3 px-4 text-center">monto ($)</th>
                <th className="py-3 px-4 text-center">abono al bien ($)</th>
                <th className="py-3 px-4 text-center">abono al iva ($)</th>
                <th className="py-3 px-4 text-center">fecha pago acordada</th>
                <th className="py-3 px-4 text-center">estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando pagos a proveedores...
                    </div>
                  </td>
                </tr>
              ) : paginatedPagos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron pagos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedPagos.map((pago: PagoCompraItem) => {
                  const compra = comprasMap.get(pago.id_compra);
                  const proveedor = compra ? proveedoresMap.get(compra.id_proveedor) : undefined;
                  const nombreProveedor = proveedor?.nombre || 'Desconocido';
                  const rutProveedor = proveedor?.rut || 'Sin RUT';
                  const porcentaje = pago.porcentaje_monto_total ? `${pago.porcentaje_monto_total}%` : 'N/A';
                  const montoNum = Number(pago.monto_a_pagar || 0);
                  const abonoBien = Number(pago.abono_al_bien || 0);
                  const abonoIva = Number(pago.abono_al_iva || 0);
                  const fechaAcordada = pago.fecha_pago_acordada
                    ? pago.fecha_pago_acordada.split('T')[0]
                    : 'S/F';
                  const isRealizado = pago.estado === 'realizado';

                  return (
                    <tr
                      key={pago.id_pago_compra}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_compra */}
                      <td className="py-3.5 px-4 font-bold text-foreground text-center">
                        #{pago.id_compra}
                      </td>

                      {/* nombre (del proveedor) */}
                      <td className="py-3.5 px-4 font-medium text-foreground text-center">
                        {nombreProveedor}
                      </td>

                      {/* rut (del proveedor) */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        {rutProveedor}
                      </td>

                      {/* porcentaje monto total (%) */}
                      <td className="py-3.5 px-4 font-semibold text-foreground text-center">
                        {porcentaje}
                      </td>

                      {/* monto ($) */}
                      <td className="py-3.5 px-4 font-bold text-foreground text-center">
                        ${montoNum.toLocaleString('es-CL')}
                      </td>

                      {/* abono al bien */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        ${abonoBien.toLocaleString('es-CL')}
                      </td>

                      {/* abono al iva */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        ${abonoIva.toLocaleString('es-CL')}
                      </td>

                      {/* fecha pago acordada */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        {fechaAcordada}
                      </td>

                      {/* estado */}
                      <td className="py-3.5 px-4 text-center">
                        {isRealizado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            realizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            pendiente
                          </span>
                        )}
                      </td>

                      {/* Acciones:
                          - Si estado === 'realizado': solo botón "Ver Detalle"
                          - Si estado === 'pendiente': solo botón "Pagar"
                          Ambos redirigen a /admin/compras/pagos-compras/:id
                      */}
                      <td className="py-3.5 px-4 text-center">
                        {isRealizado ? (
                          <button
                            onClick={() =>
                              navigate(`/admin/compras/pagos-compras/${pago.id_pago_compra}`)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            Ver Detalle
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              navigate(`/admin/compras/pagos-compras/${pago.id_pago_compra}`)
                            }
                            className="inline-flex items-center gap-1 px-3.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pagar
                          </button>
                        )}
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

export default PagoCompraPage;
