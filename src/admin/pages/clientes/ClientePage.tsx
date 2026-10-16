import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Edit2,
  Filter,
} from 'lucide-react';
import { useClientes } from '../../hooks/useClientes';
import type { ClienteItem } from '../../interfaces/cliente.interface';

export const ClientePage = () => {
  const navigate = useNavigate();
  const { clientes, isLoading } = useClientes();

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación: Máximo 3 cards por página según la imagen guía
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Filtrado de la lista por nombre, rut, correo, num_tlf y direccion
  const filteredClientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clientes;

    return clientes.filter((c: ClienteItem) => {
      return (
        c.nombre?.toLowerCase().includes(term) ||
        c.rut?.toLowerCase().includes(term) ||
        c.correo?.toLowerCase().includes(term) ||
        c.num_tlf?.toLowerCase().includes(term) ||
        c.direccion?.toLowerCase().includes(term)
      );
    });
  }, [clientes, searchTerm]);

  // Cálculo de páginas
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClientes = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredClientes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClientes, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro comercial, propietarios de repuestos y órdenes de trabajo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/clientes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/clientes/listado/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (Buscador por nombre, rut, correo, num_tlf y direccion) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-emerald-500" />
          Filtros de Búsqueda
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar cliente por nombre, RUT, correo, teléfono o dirección..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* 3. LISTADO DE CARDS (Máximo 3 por página, sin botón eliminar) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="h-8 bg-muted rounded mt-4" />
            </div>
          ))}
        </div>
      ) : paginatedClientes.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl border border-border/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            No se encontraron clientes
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No hay clientes que coincidan con la búsqueda ingresada o aún no se han registrado clientes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedClientes.map((item: ClienteItem) => (
            <div
              key={item.id_cliente}
              className="relative bg-card border border-border/80 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md"
            >
              {/* Ícono representativo circular centrado */}
              <div className="flex justify-center pt-2 pb-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Users className="w-9 h-9" />
                </div>
              </div>

              {/* Datos del Cliente: nombre, rut, correo, num_tlf, direccion */}
              <div className="space-y-2.5 text-xs text-muted-foreground my-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {item.nombre}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-foreground/90">RUT:</span>
                  <span>{item.rut || 'No registrado'}</span>
                </div>

                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-foreground/90">Correo:</span>
                  <span className="truncate">{item.correo || 'No registrado'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-foreground/90">Teléfono:</span>
                  <span>{item.num_tlf || 'No registrado'}</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground/90">Dirección: </span>
                    <span>{item.direccion || 'No registrada'}</span>
                  </div>
                </div>
              </div>

              {/* Botón de Acción: Únicamente Editar (según la confirmación del usuario) */}
              <div className="flex items-center justify-end pt-4 border-t border-border/80 mt-4">
                <button
                  onClick={() => navigate(`/admin/clientes/listado/${item.id_cliente}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                  Editar
                </button>
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
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${
                validCurrentPage === pageNum
                  ? 'bg-emerald-600 text-white shadow-sm'
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

export default ClientePage;
