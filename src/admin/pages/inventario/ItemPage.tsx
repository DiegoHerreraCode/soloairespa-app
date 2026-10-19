import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Filter,
  Edit2,
  Package,
} from 'lucide-react';
import { getInventarioAction } from '../../actions/get-inventario.action';
import type { InventarioItem } from '../../interfaces/inventario.interface';

export const ItemPage = () => {
  const navigate = useNavigate();

  // Consulta de ítems de inventario
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
    staleTime: 1000 * 60 * 3,
  });

  // Opciones de filtrado por sku, nombre, tipo y condicion
  const [skuFilter, setSkuFilter] = useState('');
  const [nombreFilter, setNombreFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [condicionFilter, setCondicionFilter] = useState<string>('all');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Filtrado de ítems
  const filteredItems = useMemo(() => {
    return items.filter((item: InventarioItem) => {
      const sku = (item.sku || '').toLowerCase();
      const nombre = (item.nombre || '').toLowerCase();
      const tipo = (item.tipo || '').toLowerCase();
      const condicion = (item.condicion || '').toLowerCase();

      // 1. Filtro por SKU
      if (skuFilter.trim() && !sku.includes(skuFilter.trim().toLowerCase())) {
        return false;
      }

      // 2. Filtro por Nombre
      if (nombreFilter.trim() && !nombre.includes(nombreFilter.trim().toLowerCase())) {
        return false;
      }

      // 3. Filtro por Tipo
      if (tipoFilter !== 'all' && tipo !== tipoFilter.toLowerCase()) {
        return false;
      }

      // 4. Filtro por Condición
      if (condicionFilter !== 'all') {
        if (condicionFilter === 'na') {
          if (condicion && condicion !== 'na') return false;
        } else if (condicion !== condicionFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [items, skuFilter, nombreFilter, tipoFilter, condicionFilter]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Items de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Catálogo maestro de insumos, compresores, válvulas y equipos
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
          <Link
            to="/admin/inventario/items/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (sku, nombre, tipo y condicion) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

          {/* Filtro por Nombre */}
          <div>
            <input
              type="text"
              value={nombreFilter}
              onChange={(e) => {
                setNombreFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Tipo (Todos)</option>
              <option value="insumo">Insumo</option>
              <option value="compresor">Compresor</option>
              <option value="valvula">Válvula</option>
              <option value="equipo">Equipo</option>
            </select>
          </div>

          {/* Filtro por Condición */}
          <div>
            <select
              value={condicionFilter}
              onChange={(e) => {
                setCondicionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Condición (Todas)</option>
              <option value="nuevo">Nuevo</option>
              <option value="usado">Usado</option>
              <option value="na">NA (No Aplica)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE ITEMS */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">sku</th>
                <th className="py-3 px-4">nombre</th>
                <th className="py-3 px-4">tipo</th>
                <th className="py-3 px-4">condicion</th>
                <th className="py-3 px-4 text-center">acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de items...
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron items de inventario con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item: InventarioItem) => {
                  return (
                    <tr
                      key={item.id_inventario}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* sku */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {item.sku || 'N/A'}
                      </td>

                      {/* nombre */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.nombre}
                      </td>

                      {/* tipo */}
                      <td className="py-3.5 px-4 capitalize text-foreground">
                        {item.tipo}
                      </td>

                      {/* condicion */}
                      <td className="py-3.5 px-4 uppercase text-foreground font-medium">
                        {item.condicion || 'NA'}
                      </td>

                      {/* acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/inventario/items/${item.id_inventario}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          Editar
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

export default ItemPage;
