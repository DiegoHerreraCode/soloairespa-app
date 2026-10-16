import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Search,
  Wrench,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { usePersonal } from '../../hooks/usePersonal';
import type { PersonalItem } from '../../interfaces/personal.interface';

type DisponibleFilter = 'all' | 'true' | 'false';
type DeletedFilter = 'all' | 'activos' | 'eliminados';

export const PersonalTallerPage = () => {
  const navigate = useNavigate();
  const { personal, isLoading, deletePersonal, isDeleting } = usePersonal();

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [disponibleFilter, setDisponibleFilter] = useState<DisponibleFilter>('all');
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>('activos');

  // Paginación: Máximo 3 cards por página según la imagen guía
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Filtrado de la lista
  const filteredPersonal = useMemo(() => {
    return personal.filter((p: PersonalItem) => {
      // Filtro de texto (nombre, rut, correo, num_tlf, direccion)
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.nombre?.toLowerCase().includes(term) ||
        p.rut?.toLowerCase().includes(term) ||
        p.correo?.toLowerCase().includes(term) ||
        p.num_tlf?.toLowerCase().includes(term) ||
        p.direccion?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Filtro por disponible
      if (disponibleFilter === 'true' && !p.disponible) return false;
      if (disponibleFilter === 'false' && p.disponible) return false;

      // Filtro por is_deleted
      if (deletedFilter === 'activos' && p.is_deleted) return false;
      if (deletedFilter === 'eliminados' && !p.is_deleted) return false;

      return true;
    });
  }, [personal, searchTerm, disponibleFilter, deletedFilter]);

  // Cálculo de páginas
  const totalPages = Math.ceil(filteredPersonal.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPersonal = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredPersonal.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPersonal, validCurrentPage, itemsPerPage]);

  const handleDelete = (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar (baja lógica) a ${nombre}?`)) {
      deletePersonal(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Personal del Taller
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Mecánicos, técnicos y operarios encargados de reparaciones
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/personal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/personal/taller/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (Buscador general + Disponibilidad + Estado de eliminación) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Buscador de texto: nombre, rut, correo, num_tlf, direccion */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, RUT, correo, teléfono o dirección..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro de Disponibilidad */}
          <div className="md:col-span-3">
            <select
              value={disponibleFilter}
              onChange={(e) => {
                setDisponibleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Disponibilidad: Todos</option>
              <option value="true">Solo Disponibles</option>
              <option value="false">Solo No Disponibles</option>
            </select>
          </div>

          {/* Filtro de is_deleted */}
          <div className="md:col-span-3">
            <select
              value={deletedFilter}
              onChange={(e) => {
                setDeletedFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="activos">Activos en Taller</option>
              <option value="eliminados">Fuera del Taller (Eliminados)</option>
              <option value="all">Ver Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. LISTADO DE CARDS (Máximo 3 por página) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="h-8 bg-muted rounded mt-4" />
            </div>
          ))}
        </div>
      ) : paginatedPersonal.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl border border-border/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            No se encontró personal de taller
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No hay trabajadores que coincidan con los filtros aplicados o aún no se han registrado técnicos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPersonal.map((item: PersonalItem) => (
            <div
              key={item.id_personal}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md ${item.is_deleted
                ? 'border-rose-500/40 bg-rose-500/[0.02]'
                : 'border-border/80 hover:border-blue-500/40'
                }`}
            >
              {/* Badge superior si is_deleted = true */}
              {item.is_deleted && (
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Fuera del Taller
                </div>
              )}

              {/* Ícono representativo centrado */}
              <div className="flex justify-center pt-2 pb-4">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
                  <Wrench className="w-9 h-9" />
                </div>
              </div>

              {/* Datos del Personal: nombre, rut, correo, num_tlf, direccion, disponible */}
              <div className="space-y-2.5 text-xs text-muted-foreground my-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {item.nombre}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-foreground/90">RUT:</span>
                  <span>{item.rut || 'No registrado'}</span>
                </div>

                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-foreground/90">Correo:</span>
                  <span className="truncate">{item.correo || 'No registrado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-foreground/90">Teléfono:</span>
                  <span>{item.num_tlf || 'No registrado'}</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground/90">Dirección: </span>
                    <span>{item.direccion || 'No registrada'}</span>
                  </div>
                </div>

                {/* Disponibilidad */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="font-semibold text-foreground/90">Disponibilidad:</span>
                  {item.disponible ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <XCircle className="w-3 h-3" />
                      No Disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Acción: Editar y Eliminar */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/80 mt-4">
                <button
                  onClick={() => navigate(`/admin/personal/taller/${item.id_personal}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                  Editar
                </button>

                {!item.is_deleted && (
                  <button
                    disabled={isDeleting}
                    onClick={() => handleDelete(item.id_personal, item.nombre)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

export default PersonalTallerPage;
