import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Edit2,
  Layers,
} from 'lucide-react';
import { useTiposServiciosTaller } from '../../hooks/useTipoServiciotaller';
import type { TipoServicioTallerItem } from '../../interfaces/tipo-servicio-taller.interface';

export const TipoServicioTallerPage = () => {
  const navigate = useNavigate();
  const { tiposServiciosTaller, isLoading } = useTiposServiciosTaller();

  // Opciones de filtrado por nombre
  const [nombreTipoServicioFilter, setNombreTipoServicioFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Filtrado de modelos
  const filteredTiposServiciosTaller = useMemo(() => {
    return tiposServiciosTaller.filter((tipoServicioTaller: TipoServicioTallerItem) => {
      const nombreTipoServicio = (tipoServicioTaller.nombre || '').toLowerCase();

      // 1. Filtro por nombre de tipo de servicio
      if (nombreTipoServicioFilter.trim() && !nombreTipoServicio.includes(nombreTipoServicioFilter.trim().toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [tiposServiciosTaller, nombreTipoServicioFilter]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredTiposServiciosTaller.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTiposServiciosTaller = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredTiposServiciosTaller.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTiposServiciosTaller, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y + Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Tipos de Servicios del Taller
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Tipos de servicios del taller clasificados por nombre
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
            to="/admin/taller/tipos-servicios/new"
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
          {/* Filtro por nombre de tipo de servicio */}
          <div>
            <input
              type="text"
              value={nombreTipoServicioFilter}
              onChange={(e) => {
                setNombreTipoServicioFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre de tipo de servicio..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE TIPOS DE SERVICIOS DEL TALLER*/}
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
                      Cargando listado de tipos de servicios del taller...
                    </div>
                  </td>
                </tr>
              ) : paginatedTiposServiciosTaller.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron tipos de servicios del taller con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedTiposServiciosTaller.map((tipoServicioTaller: TipoServicioTallerItem) => {
                  return (
                    <tr
                      key={tipoServicioTaller.id_tipo_servicio_taller}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* nombre */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {tipoServicioTaller.nombre}
                      </td>

                      {/* descripción */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {tipoServicioTaller.descripcion || 'Sin descripción'}
                      </td>

                      {/* Acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/taller/tipos-servicios/${tipoServicioTaller.id_tipo_servicio_taller}`)}
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

export default TipoServicioTallerPage;
