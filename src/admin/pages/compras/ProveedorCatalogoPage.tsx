import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  Building2,
  Save,
  X,
  Tag,
} from 'lucide-react';
import { getProveedorByIdAction } from '../../actions/get-proveedor-by-id.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import {
  getInventarioProveedoresAction,
  createInventarioProveedorAction,
  updateInventarioProveedorAction,
  deleteInventarioProveedorAction,
} from '../../actions/inventario-proveedor.action';
import type { InventarioItem } from '../../interfaces/inventario.interface';
import type { InventarioProveedorItem } from '../../interfaces/inventario-proveedor.interface';

export const ProveedorCatalogoPage = () => {
  const { id } = useParams<{ id: string }>();
  const idProveedor = Number(id);
  const queryClient = useQueryClient();

  // 1. Cargar información del proveedor
  const { data: proveedor, isLoading: isLoadingProveedor } = useQuery({
    queryKey: ['proveedor-item', idProveedor],
    queryFn: () => getProveedorByIdAction(idProveedor),
    enabled: !!idProveedor,
  });

  // 2. Cargar todos los ítems de inventario maestros
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
    staleTime: 1000 * 60 * 3,
  });

  // 3. Cargar las homologaciones de este proveedor
  const {
    data: itemsCatalogo = [],
    isLoading: isLoadingCatalogo,
  } = useQuery({
    queryKey: ['inventario-proveedores', idProveedor],
    queryFn: () => getInventarioProveedoresAction({ id_proveedor: idProveedor }),
    enabled: !!idProveedor,
  });

  // Mapeo rápido de inventario por id_inventario
  const inventarioMap = useMemo(() => {
    const map = new Map<number, InventarioItem>();
    inventario.forEach((inv) => map.set(inv.id_inventario, inv));
    return map;
  }, [inventario]);

  // Estados de filtrado en la tabla
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Estados para Modal / Formulario de Nuevo Registro
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInventarioId, setSelectedInventarioId] = useState<string>('');
  const [newCodigoProveedor, setNewCodigoProveedor] = useState('');

  // Estados para Modal de Edición de Código
  const [editingItem, setEditingItem] = useState<InventarioProveedorItem | null>(null);
  const [editCodigoProveedor, setEditCodigoProveedor] = useState('');

  // Mutación: Crear nuevo registro en el catálogo
  const createMutation = useMutation({
    mutationFn: createInventarioProveedorAction,
    onSuccess: () => {
      toast.success('Ítem añadido al catálogo del proveedor exitosamente');
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores', idProveedor] });
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores-listado'] });
      setIsCreateModalOpen(false);
      setSelectedInventarioId('');
      setNewCodigoProveedor('');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('No se pudo asociar el ítem al catálogo');
    },
  });

  // Mutación: Editar código
  const updateMutation = useMutation({
    mutationFn: ({ id, codigo }: { id: number; codigo: string }) =>
      updateInventarioProveedorAction(id, { codigo_proveedor: codigo }),
    onSuccess: () => {
      toast.success('Código de proveedor actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores', idProveedor] });
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores-listado'] });
      setEditingItem(null);
      setEditCodigoProveedor('');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('No se pudo actualizar el código');
    },
  });

  // Mutación: Eliminar registro del catálogo
  const deleteMutation = useMutation({
    mutationFn: deleteInventarioProveedorAction,
    onSuccess: () => {
      toast.success('Ítem removido del catálogo del proveedor');
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores', idProveedor] });
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores-listado'] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('No se pudo remover el ítem del catálogo');
    },
  });

  // Filtrado de la tabla de catálogo
  const filteredCatalogo = useMemo(() => {
    return itemsCatalogo.filter((rel) => {
      const itemInv = inventarioMap.get(rel.id_inventario);
      const codProv = (rel.codigo_proveedor || '').toLowerCase();
      const sku = (itemInv?.sku || '').toLowerCase();
      const nombre = (itemInv?.nombre || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      if (!term) return true;
      return codProv.includes(term) || sku.includes(term) || nombre.includes(term);
    });
  }, [itemsCatalogo, inventarioMap, searchTerm]);

  // Ordenar descendente por id_inventario_proveedor
  filteredCatalogo.sort((a, b) => b.id_inventario_proveedor - a.id_inventario_proveedor);

  // Paginación (7 filas por página)
  const totalPages = Math.ceil(filteredCatalogo.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCatalogo = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredCatalogo.slice(start, start + itemsPerPage);
  }, [filteredCatalogo, validCurrentPage, itemsPerPage]);

  // Ítems ya asignados al catálogo para excluirlos del select de nuevo ítem
  const assignedItemIds = useMemo(() => {
    return new Set(itemsCatalogo.map((i) => i.id_inventario));
  }, [itemsCatalogo]);

  const availableInventario = useMemo(() => {
    return inventario.filter((inv) => !assignedItemIds.has(inv.id_inventario));
  }, [inventario, assignedItemIds]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventarioId || !newCodigoProveedor.trim()) {
      toast.warning('Por favor selecciona un ítem e ingresa el código del proveedor');
      return;
    }

    createMutation.mutate({
      id_proveedor: idProveedor,
      id_inventario: Number(selectedInventarioId),
      codigo_proveedor: newCodigoProveedor.trim(),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editCodigoProveedor.trim()) return;

    updateMutation.mutate({
      id: editingItem.id_inventario_proveedor,
      codigo: editCodigoProveedor.trim(),
    });
  };

  const handleDelete = (item: InventarioProveedorItem) => {
    const itemInv = inventarioMap.get(item.id_inventario);
    if (
      window.confirm(
        `¿Estás seguro de remover el ítem "${itemInv?.nombre || 'seleccionado'}" del catálogo de este proveedor?`
      )
    ) {
      deleteMutation.mutate(item.id_inventario_proveedor);
    }
  };

  const isLoading = isLoadingProveedor || isLoadingCatalogo || isLoadingInventario;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
            <Building2 className="w-4 h-4" />
            Catálogo Comercial del Proveedor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {proveedor?.nombre || `Proveedor #${idProveedor}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            RUT: <span className="font-mono font-semibold text-foreground">{proveedor?.rut || 'S/R'}</span> • Homologación de códigos para compras
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/compras/proveedores"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Proveedores
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Homologar Nuevo Ítem
          </button>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda en el Catálogo
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
            placeholder="Buscar por código de proveedor, SKU o nombre del ítem..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 3. TABLA DE ÍTEMS DEL CATÁLOGO (7 registros por página) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">ID Homologación</th>
                <th className="py-3 px-4">Código Proveedor</th>
                <th className="py-3 px-4">SKU Bodega</th>
                <th className="py-3 px-4">Nombre del Ítem</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando catálogo del proveedor...
                    </div>
                  </td>
                </tr>
              ) : paginatedCatalogo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No hay ítems registrados en el catálogo de este proveedor con los filtros actuales
                  </td>
                </tr>
              ) : (
                paginatedCatalogo.map((rel) => {
                  const itemInv = inventarioMap.get(rel.id_inventario);

                  return (
                    <tr key={rel.id_inventario_proveedor} className="hover:bg-accent/40 transition-colors">
                      {/* ID Homologación */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        #{rel.id_inventario_proveedor}
                      </td>

                      {/* Código Proveedor */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {rel.codigo_proveedor}
                      </td>

                      {/* SKU Bodega */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                        {itemInv?.sku || 'N/A'}
                      </td>

                      {/* Nombre */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {itemInv?.nombre || `Ítem #${rel.id_inventario}`}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 capitalize text-foreground">
                        {itemInv?.tipo || '-'}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(rel);
                              setEditCodigoProveedor(rel.codigo_proveedor);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                            title="Editar código de proveedor"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(rel)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Eliminar ítem del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${validCurrentPage === pageNum
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
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA HOMOLOGACIÓN */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/90 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500" />
                Homologar Ítem en Catálogo
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Ítem de Inventario (Bodega) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedInventarioId}
                  onChange={(e) => setSelectedInventarioId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="">Selecciona un ítem de inventario...</option>
                  {availableInventario.map((item) => (
                    <option key={item.id_inventario} value={item.id_inventario}>
                      {item.nombre} (SKU: {item.sku || 'S/SKU'} - {item.tipo})
                    </option>
                  ))}
                </select>
                {availableInventario.length === 0 && (
                  <p className="text-[11px] text-amber-500">
                    Todos los ítems de inventario ya están homologados con este proveedor.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Código del Proveedor (Factura / Catálogo) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCodigoProveedor}
                  onChange={(e) => setNewCodigoProveedor(e.target.value)}
                  placeholder="Ej: 13703-2 o VAD-9250"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || availableInventario.length === 0}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Homologación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CÓDIGO DE PROVEEDOR */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/90 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-500" />
                Editar Código de Proveedor
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <span className="text-[11px] text-muted-foreground block">Ítem seleccionado</span>
                <span className="text-xs font-bold text-foreground">
                  {inventarioMap.get(editingItem.id_inventario)?.nombre || `Ítem #${editingItem.id_inventario}`}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground block">
                  SKU: {inventarioMap.get(editingItem.id_inventario)?.sku || 'N/A'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Nuevo Código del Proveedor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCodigoProveedor}
                  onChange={(e) => setEditCodigoProveedor(e.target.value)}
                  required
                  placeholder="Ej: 13703-2"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Actualizar Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedorCatalogoPage;
