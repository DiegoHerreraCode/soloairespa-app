import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft,
  Filter,
  Trash2,
  RotateCcw,
  Cpu,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEquipos } from '../../hooks/useEquipos';
import { deleteEquipoAction } from '../../actions/delete-equipo.action';
import { recuperarEquipoAction } from '../../actions/recuperar-equipo.action';
import type { EquipoItem } from '../../interfaces/equipo.interface';

export const EquipoPage = () => {
  const queryClient = useQueryClient();
  const { equipos, inventario, compras, isLoading } = useEquipos();

  // Opciones de filtrado por: sku, serial, id_compra, id_detalle_compra y disponible
  const [skuFilter, setSkuFilter] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [idCompraFilter, setIdCompraFilter] = useState('');
  const [idDetalleCompraFilter, setIdDetalleCompraFilter] = useState('');
  const [disponibleFilter, setDisponibleFilter] = useState<'all' | 'si' | 'no'>('all');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de inventario por id_inventario para resolver SKU y Nombre
  const inventarioMap = useMemo(() => {
    const map = new Map<number, (typeof inventario)[0]>();
    inventario.forEach((inv) => map.set(inv.id_inventario, inv));
    return map;
  }, [inventario]);

  // Mapa de id_detalle_compra -> id_compra para resolver el id_compra de cada equipo
  const detalleCompraToCompraMap = useMemo(() => {
    const map = new Map<number, number>();
    compras.forEach((compra) => {
      compra.detalles?.forEach((det) => {
        if (det.id_detalle_compra) {
          map.set(det.id_detalle_compra, compra.id_compra);
        }
      });
    });
    return map;
  }, [compras]);

  // Mutación para Eliminar (Soft delete: DELETE /api/equipos/:id)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEquipoAction(id),
    onSuccess: () => {
      toast.success('Equipo eliminado con éxito');
      queryClient.invalidateQueries({ queryKey: ['equipos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al eliminar el equipo';
      toast.error(msg);
    },
  });

  // Mutación para Recuperar (PUT /api/equipos/:id con { is_deleted: false })
  const recuperarMutation = useMutation({
    mutationFn: (id: number) => recuperarEquipoAction(id),
    onSuccess: () => {
      toast.success('Equipo recuperado con éxito');
      queryClient.invalidateQueries({ queryKey: ['equipos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al recuperar el equipo';
      toast.error(msg);
    },
  });

  // Filtrado de equipos
  const filteredEquipos = useMemo(() => {
    return equipos.filter((eq: EquipoItem) => {
      const itemInv = inventarioMap.get(eq.id_inventario);
      const sku = (itemInv?.sku || '').toLowerCase();
      const serial = (eq.serial || '').toLowerCase();
      const idCompra = eq.id_detalle_compra ? detalleCompraToCompraMap.get(eq.id_detalle_compra) : undefined;
      const isDeleted = eq.is_deleted === true || String(eq.is_deleted) === '1';

      // 1. Filtro por SKU
      if (skuFilter.trim() && !sku.includes(skuFilter.trim().toLowerCase())) {
        return false;
      }

      // 2. Filtro por Serial
      if (serialFilter.trim() && !serial.includes(serialFilter.trim().toLowerCase())) {
        return false;
      }

      // 3. Filtro por id_compra
      if (idCompraFilter.trim()) {
        const queryId = idCompraFilter.trim();
        if (!idCompra || !String(idCompra).includes(queryId)) {
          return false;
        }
      }

      // 4. Filtro por id_detalle_compra
      if (idDetalleCompraFilter.trim()) {
        const queryDet = idDetalleCompraFilter.trim();
        if (!eq.id_detalle_compra || !String(eq.id_detalle_compra).includes(queryDet)) {
          return false;
        }
      }

      // 5. Filtro por disponible (is_deleted: Si = no eliminado / No = eliminado)
      if (disponibleFilter !== 'all') {
        if (disponibleFilter === 'si' && isDeleted) return false;
        if (disponibleFilter === 'no' && !isDeleted) return false;
      }

      return true;
    });
  }, [
    equipos,
    inventarioMap,
    detalleCompraToCompraMap,
    skuFilter,
    serialFilter,
    idCompraFilter,
    idDetalleCompraFilter,
    disponibleFilter,
  ]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEquipos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredEquipos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEquipos, validCurrentPage, itemsPerPage]);

  const handleDelete = (id: number) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el equipo #${id}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleRecuperar = (id: number) => {
    recuperarMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Equipos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestión de equipos serializados, disponibilidad y trazabilidad
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

      {/* 2. OPCIONES DE FILTRADO (sku, serial, id_compra, id_detalle_compra y disponible) */}
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
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* Filtro por id_compra */}
          <div>
            <input
              min={1}
              type="number"
              value={idCompraFilter}
              onChange={(e) => {
                setIdCompraFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por id_compra..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por id_detalle_compra */}
          <div>
            <input
              min={1}
              type="number"
              value={idDetalleCompraFilter}
              onChange={(e) => {
                setIdDetalleCompraFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por id_detalle..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Disponible (is_deleted) */}
          <div>
            <select
              value={disponibleFilter}
              onChange={(e) => {
                setDisponibleFilter(e.target.value as 'all' | 'si' | 'no');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Disponible (Todos)</option>
              <option value="si">Disponible: Sí</option>
              <option value="no">Disponible: No</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE EQUIPOS */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">sku</th>
                <th className="py-3 px-4">serial</th>
                <th className="py-3 px-4 text-center">id_compra</th>
                <th className="py-3 px-4 text-center">id_detalle_compra</th>
                <th className="py-3 px-4 text-center">
                  <div>disponible</div>
                </th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de equipos...
                    </div>
                  </td>
                </tr>
              ) : paginatedEquipos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Cpu className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron equipos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedEquipos.map((equipo: EquipoItem) => {
                  const itemInv = inventarioMap.get(equipo.id_inventario);
                  const isDeleted = equipo.is_deleted === true || String(equipo.is_deleted) === '1';
                  const idCompra = equipo.id_detalle_compra
                    ? detalleCompraToCompraMap.get(equipo.id_detalle_compra)
                    : null;

                  return (
                    <tr
                      key={equipo.id_equipo}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* sku */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {itemInv?.sku || 'N/A'}
                      </td>

                      {/* serial */}
                      <td className="py-3.5 px-4 font-mono text-foreground font-semibold">
                        {equipo.serial || 'Sin serial'}
                      </td>

                      {/* id_compra */}
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        {idCompra ? (
                          <span>{idCompra}</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">-</span>
                        )}
                      </td>

                      {/* id_detalle_compra */}
                      <td className="py-3.5 px-4 text-center font-semibold text-foreground">
                        {equipo.id_detalle_compra || '-'}
                      </td>

                      {/* disponible (is_deleted: Si cuando !is_deleted, No cuando is_deleted) */}
                      <td className="py-3.5 px-4 text-center">
                        {!isDeleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Si
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            No
                          </span>
                        )}
                      </td>

                      {/* Acciones: Eliminar si !isDeleted / Recuperar si isDeleted */}
                      <td className="py-3.5 px-4 text-center">
                        {!isDeleted ? (
                          <button
                            onClick={() => handleDelete(equipo.id_equipo)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRecuperar(equipo.id_equipo)}
                            disabled={recuperarMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Recuperar
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

export default EquipoPage;
