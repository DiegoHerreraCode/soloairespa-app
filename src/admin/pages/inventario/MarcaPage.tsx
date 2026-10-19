import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Edit2,
  Layers,
} from 'lucide-react';
import { useMarcas } from '../../hooks/useMarcas';
import type { MarcaItem } from '../../interfaces/marca.interface';

export const MarcaPage = () => {
  const navigate = useNavigate();
  const { marcas, isLoading } = useMarcas();

  // Opcion de filtrado por nombre de marca
  const [marcaFilter, setMarcaFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Filtrado de marcas
  const filteredMarcas = useMemo(() => {
    return marcas.filter((mar: MarcaItem) => {
      const nombreMarca = (mar.nombre || '').toLowerCase();

      // 1. Filtro por nombre de marca
      if (marcaFilter.trim() && !nombreMarca.includes(marcaFilter.trim().toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [marcas, marcaFilter]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredMarcas.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedMarcas = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredMarcas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMarcas, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y + Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Marcas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Marcas técnicas clasificadas por fabricante y marca comercial
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
            to="/admin/inventario/marcas/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (nombre de marca) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Filtro por nombre de marca */}
          <div>
            <input
              type="text"
              value={marcaFilter}
              onChange={(e) => {
                setMarcaFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre de marca..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE MODELOS */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">nombre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={1} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de marcas...
                    </div>
                  </td>
                </tr>
              ) : paginatedMarcas.length === 0 ? (
                <tr>
                  <td colSpan={1} className="py-8 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron marcas con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedMarcas.map((marca: MarcaItem) => {
                  return (
                    <tr
                      key={marca.id_marca}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* nombre */}
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {marca.nombre}
                      </td>

                      {/* Acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/inventario/marcas/${marca.id_marca}`)}
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

export default MarcaPage;
