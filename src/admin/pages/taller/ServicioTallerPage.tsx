import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Edit2,
  Wrench,
} from 'lucide-react';
import { useServiciosTaller } from '../../hooks/useServiciosTaller';
import type { ServicioTallerItem } from '../../interfaces/servicio-taller.interface';

export const ServicioTallerPage = () => {
  const navigate = useNavigate();
  const { serviciosTaller, tiposServiciosTaller, isLoading } = useServiciosTaller();

  // Opciones de filtrado por nombre de tipo de servicio del taller y nombre del servicio del taller
  const [tipoServicioFilter, setTipoServicioFilter] = useState('');
  const [nombreServicioFilter, setNombreServicioFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de tipos de servicio por id_tipo_servicio_taller
  const tiposServiciosMap = useMemo(() => {
    const map = new Map<number, (typeof tiposServiciosTaller)[0]>();
    tiposServiciosTaller.forEach((t) => map.set(t.id_tipo_servicio_taller, t));
    return map;
  }, [tiposServiciosTaller]);

  // Filtrado de servicios del taller
  const filteredServicios = useMemo(() => {
    return serviciosTaller.filter((serv: ServicioTallerItem) => {
      const tipoObj = serv.tipo_servicio_taller || tiposServiciosMap.get(serv.id_tipo_servicio_taller);
      const nombreTipo = (tipoObj?.nombre || '').toLowerCase();
      const nombreServicio = (serv.nombre || '').toLowerCase();

      // 1. Filtro por nombre de tipo de servicio del taller
      if (tipoServicioFilter.trim() && !nombreTipo.includes(tipoServicioFilter.trim().toLowerCase())) {
        return false;
      }

      // 2. Filtro por nombre del servicio del taller
      if (nombreServicioFilter.trim() && !nombreServicio.includes(nombreServicioFilter.trim().toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [serviciosTaller, tiposServiciosMap, tipoServicioFilter, nombreServicioFilter]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedServicios = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredServicios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServicios, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Servicios del Taller
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Servicios técnicos clasificados por tipo de servicio especializado
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
            to="/admin/taller/servicios/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (nombre de tipo de servicio del taller y nombre del servicio del taller) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Filtro por nombre de tipo de servicio del taller */}
          <div>
            <input
              type="text"
              value={tipoServicioFilter}
              onChange={(e) => {
                setTipoServicioFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre de tipo de servicio del taller..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por nombre del servicio del taller */}
          <div>
            <input
              type="text"
              value={nombreServicioFilter}
              onChange={(e) => {
                setNombreServicioFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre del servicio del taller..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE SERVICIOS DEL TALLER */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">tipo de servicio</th>
                <th className="py-3 px-4">nombre</th>
                <th className="py-3 px-4 text-center">acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de servicios del taller...
                    </div>
                  </td>
                </tr>
              ) : paginatedServicios.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron servicios del taller con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedServicios.map((servicio: ServicioTallerItem) => {
                  const tipoObj = servicio.tipo_servicio_taller || tiposServiciosMap.get(servicio.id_tipo_servicio_taller);
                  const nombreTipo = tipoObj?.nombre || `Tipo #${servicio.id_tipo_servicio_taller}`;

                  return (
                    <tr
                      key={servicio.id_servicio_taller}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* tipo de servicio (nombre) */}
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {nombreTipo}
                      </td>

                      {/* nombre */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {servicio.nombre}
                      </td>

                      {/* acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/taller/servicios/${servicio.id_servicio_taller}`)}
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

export default ServicioTallerPage;
