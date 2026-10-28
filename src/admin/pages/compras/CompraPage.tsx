import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Search,
  ShoppingBag,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useCompras } from '../../hooks/useCompras';
import type { CompraItem } from '../../interfaces/compra.interface';

export const CompraPage = () => {
  const navigate = useNavigate();
  const { compras, proveedores, isLoading } = useCompras();

  // Estados de filtrado: nombre, rut, id_compra, num_factura_boleta, estado, tipo_pago, fecha desde y fecha hasta
  const [searchTerm, setSearchTerm] = useState('');
  const [idCompraFilter, setIdCompraFilter] = useState('');
  const [numFacturaBoletaFilter, setNumFacturaBoletaFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'por_pagar' | 'pagada_parcial' | 'pagada'>('all');
  const [tipoPagoFilter, setTipoPagoFilter] = useState<'all' | 'contado' | 'credito'>('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de Proveedores por ID para resolver Nombre y RUT
  const proveedoresMap = useMemo(() => {
    const map = new Map<number, (typeof proveedores)[0]>();
    proveedores.forEach((p) => map.set(p.id_proveedor, p));
    return map;
  }, [proveedores]);

  // Filtrado de compras
  const filteredCompras = useMemo(() => {
    return compras.filter((c: CompraItem) => {
      const proveedor = proveedoresMap.get(c.id_proveedor);
      const nombreProveedor = (proveedor?.nombre || c.proveedor?.nombre || '').toLowerCase();
      const rutProveedor = (proveedor?.rut || c.proveedor?.rut || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      // 1. Filtro de texto: Nombre o RUT del proveedor
      if (term && !nombreProveedor.includes(term) && !rutProveedor.includes(term)) {
        return false;
      }

      // 2. Filtro por id_compra
      if (idCompraFilter.trim() && String(c.id_compra) !== idCompraFilter.trim()) {
        return false;
      }

      // 3. Filtro por num_factura_boleta
      if (
        numFacturaBoletaFilter.trim() &&
        c.num_factura_boleta &&
        !String(c.num_factura_boleta).toLowerCase().includes(numFacturaBoletaFilter.toLowerCase())
      ) {
        return false;
      }

      // 4. Filtro por estado
      if (estadoFilter !== 'all' && c.estado !== estadoFilter) {
        return false;
      }

      // 5. Filtro por tipo de pago
      if (tipoPagoFilter !== 'all' && c.tipo_pago !== tipoPagoFilter) {
        return false;
      }

      // 6. Filtro por fechas
      const fechaLimpia = c.fecha_compra ? c.fecha_compra.split('T')[0].split(' ')[0] : '';
      if (fechaDesde && fechaLimpia && fechaLimpia < fechaDesde) {
        return false;
      }
      if (fechaHasta && fechaLimpia && fechaLimpia > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [compras, proveedoresMap, searchTerm, idCompraFilter, numFacturaBoletaFilter, estadoFilter, tipoPagoFilter, fechaDesde, fechaHasta]);

  // Ordenar el arreglo FilteredCompras por el campo id_compra de forma descendente
  filteredCompras.sort((a: CompraItem, b: CompraItem) => {
    if (a.id_compra < b.id_compra) return 1;
    if (a.id_compra > b.id_compra) return -1;
    return 0;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCompras = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredCompras.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCompras, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nueva */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Compras
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro y control de compras efectuadas a proveedores
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
          <Link
            to="/admin/compras/listado/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (nombre, rut, id_compra, estado, tipo_pago, fecha desde y fecha hasta) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Buscador de Nombre o RUT del proveedor */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
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
          <div className="lg:col-span-2">
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

          {/* Filtro por Num Factura Boleta */}
          <div className="lg:col-span-2">
            <input
              type="text"
              value={numFacturaBoletaFilter}
              onChange={(e) => {
                setNumFacturaBoletaFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="N° Factura/Boleta..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Tipo de Pago */}
          <div className="lg:col-span-2">
            <select
              value={tipoPagoFilter}
              onChange={(e) => {
                setTipoPagoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Tipo de Pago: Todos</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="lg:col-span-2">
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Estado: Todos</option>
              <option value="por_pagar">Por Pagar</option>
              <option value="pagada_parcial">Pagada Parcial</option>
              <option value="pagada">Pagada</option>
            </select>
          </div>

          {/* Rango de Fechas con espacio holgado */}
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row items-center gap-2 bg-background/50 border border-border/60 p-1.5 px-3 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setCurrentPage(1);
              }}
              title="Fecha de compra desde"
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
              title="Fecha de compra hasta"
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE COMPRAS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 text-center">id_compra</th>
                <th className="py-3 px-4 text-center">nombre (del proveedor)</th>
                <th className="py-3 px-4 text-center">rut (del proveedor)</th>
                <th className="py-3 px-4 text-center">num factura boleta</th>
                <th className="py-3 px-4 text-center">Tipo de pago</th>
                <th className="py-3 px-4 text-center">monto total</th>
                <th className="py-3 px-4 text-center">monto pendiente</th>
                <th className="py-3 px-4 text-center">fecha</th>
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
                      Cargando listado de compras...
                    </div>
                  </td>
                </tr>
              ) : paginatedCompras.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron compras con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedCompras.map((compra: CompraItem) => {
                  const proveedor = proveedoresMap.get(compra.id_proveedor);
                  const nombreProveedor = proveedor?.nombre || compra.proveedor?.nombre || 'Desconocido';
                  const rutProveedor = proveedor?.rut || compra.proveedor?.rut || 'Sin RUT';
                  const montoTotal = Number(compra.monto_total || 0);
                  const montoPendiente = Number(compra.monto_pendiente || 0);
                  const fechaStr = compra.fecha_compra ? compra.fecha_compra.split('T')[0] : 'S/F';

                  return (
                    <tr
                      key={compra.id_compra}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_compra */}
                      <td className="py-3.5 px-4 font-bold text-foreground text-center">
                        #{compra.id_compra}
                      </td>

                      {/* nombre (del proveedor) */}
                      <td className="py-3.5 px-4 font-medium text-foreground text-center">
                        {nombreProveedor}
                      </td>

                      {/* rut (del proveedor) */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        {rutProveedor}
                      </td>

                      {/* num factura boleta */}
                      <td className="py-3.5 px-4 font-mono text-foreground font-semibold text-center">
                        {compra.num_factura_boleta}
                      </td>

                      {/* Tipo de pago */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-accent/60 text-foreground border border-border/60">
                          {compra.tipo_pago}
                        </span>
                      </td>

                      {/* monto total */}
                      <td className={`py-3.5 px-4 font-bold text-foreground text-center`}>
                        ${montoTotal.toLocaleString('es-CL')}
                      </td>

                      {/* monto pendiente */}
                      <td className={`py-3.5 px-4 font-bold text-rose-500 dark:text-rose-400 text-center`}>
                        ${montoPendiente.toLocaleString('es-CL')}
                      </td>

                      {/* fecha */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        {fechaStr}
                      </td>

                      {/* estado: pagada, pagada_parcial, por_pagar */}
                      <td className="py-3.5 px-4 text-center">
                        {compra.estado === 'pagada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            pagada
                          </span>
                        ) : compra.estado === 'pagada_parcial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            pagada parcial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            por pagar
                          </span>
                        )}
                      </td>

                      {/* Acciones: Botón Ver Detalle según boceto */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/compras/listado/${compra.id_compra}`)}
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

export default CompraPage;
