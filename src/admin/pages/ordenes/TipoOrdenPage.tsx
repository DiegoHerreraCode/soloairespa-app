import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Edit2,
  Layers,
} from 'lucide-react';
import { useTiposOrdenes } from '../../hooks/useTiposOrdenes';
import type { TipoOrdenItem } from '../../interfaces/tipo-orden.interface';

export const TipoOrdenPage = () => {
  const navigate = useNavigate();
  const { tiposOrdenes, isLoading } = useTiposOrdenes();

  // Opciones de filtrado por nombre
  const [nombreTipoOrdenFilter, setNombreTipoOrdenFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Filtrado de tipos de ordenes
  const filteredTiposOrdenes = useMemo(() => {
    return tiposOrdenes.filter((tipoOrden: TipoOrdenItem) => {
      const nombreTipoOrden = (tipoOrden.nombre || '').toLowerCase();

      // 1. Filtro por nombre de tipo de orden
      if (nombreTipoOrdenFilter.trim() && !nombreTipoOrden.includes(nombreTipoOrdenFilter.trim().toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [tiposOrdenes, nombreTipoOrdenFilter]);

  // Ordenar el arreglo FilteredTiposOrdenes por el campo id_tipo_orden de forma descendente
  filteredTiposOrdenes.sort((a: TipoOrdenItem, b: TipoOrdenItem) => {
    if (a.id_tipo_orden < b.id_tipo_orden) return 1;
    if (a.id_tipo_orden > b.id_tipo_orden) return -1;
    return 0;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredTiposOrdenes.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTiposOrdenes = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredTiposOrdenes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTiposOrdenes, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y + Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Tipos de Ordenes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Tipos de ordenes clasificados por nombre
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
            to="/admin/ordenes/tipos-ordenes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCION DE FILTRADO (nombre) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtro de Búsqueda
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Filtro por nombre de tipo de orden */}
          <div>
            <input
              type="text"
              value={nombreTipoOrdenFilter}
              onChange={(e) => {
                setNombreTipoOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre de tipo de orden..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE TIPOS DE ORDENES*/}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">nombre</th>
                <th className="py-3 px-4">descripción</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de tipos de ordenes...
                    </div>
                  </td>
                </tr>
              ) : paginatedTiposOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron tipos de ordenes con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedTiposOrdenes.map((tipoOrden: TipoOrdenItem) => {
                  return (
                    <tr
                      key={tipoOrden.id_tipo_orden}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* nombre */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {tipoOrden.nombre}
                      </td>

                      {/* descripción */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {tipoOrden.descripcion || 'Sin descripción'}
                      </td>

                      {/* Acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/ordenes/tipos-ordenes/${tipoOrden.id_tipo_orden}`)}
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

export default TipoOrdenPage;
