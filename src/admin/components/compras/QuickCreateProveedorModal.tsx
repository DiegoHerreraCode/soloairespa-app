import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Building2, X, Save, Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateProveedorAction } from '@/admin/actions/create-update-proveedor.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import type { ProveedorItem } from '@/admin/interfaces/proveedor.interface';
import type { CreateUpdateProveedorPayload, ProveedorItemPayload } from '@/admin/actions/create-update-proveedor.action';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface QuickCreateProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (proveedor: ProveedorItem) => void;
}

interface ItemFila {
  id_inventario: number | '';
  codigo_proveedor: string;
  ultimo_monto_compra: number | '';
}

export const QuickCreateProveedorModal: React.FC<QuickCreateProveedorModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const queryClient = useQueryClient();

  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
    enabled: isOpen,
  });

  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [correo, setCorreo] = useState('');
  const [numTlf, setNumTlf] = useState('');
  const [direccion, setDireccion] = useState('');
  const [itemsAsociados, setItemsAsociados] = useState<ItemFila[]>([]);

  const mutation = useMutation({
    mutationFn: (payload: CreateUpdateProveedorPayload) => createUpdateProveedorAction(payload),
    onSuccess: (nuevoProveedor) => {
      toast.success(`Proveedor "${nuevoProveedor.nombre}" creado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['proveedores-listado'] });
      queryClient.invalidateQueries({ queryKey: ['proveedores-select'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores-listado'] });
      onCreated(nuevoProveedor);
      handleReset();
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      const errors = err?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
        return;
      }
      toast.error(err?.response?.data?.message || 'Error al crear el proveedor');
    },
  });

  const handleReset = () => {
    setNombre('');
    setRut('');
    setCorreo('');
    setNumTlf('');
    setDireccion('');
    setItemsAsociados([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !rut.trim()) {
      toast.warning('El nombre y RUT del proveedor son obligatorios');
      return;
    }

    // Validar filas de ítems si se añadieron
    for (let i = 0; i < itemsAsociados.length; i++) {
      const it = itemsAsociados[i];
      if (!it.id_inventario) {
        toast.warning(`Fila #${i + 1}: Seleccione un ítem de inventario`);
        return;
      }
      if (!it.codigo_proveedor.trim()) {
        toast.warning(`Fila #${i + 1}: Ingrese el código de proveedor`);
        return;
      }
    }

    // Validar duplicados de id_inventario
    const idsSet = new Set<number>();
    for (const it of itemsAsociados) {
      if (it.id_inventario) {
        if (idsSet.has(Number(it.id_inventario))) {
          toast.warning('No puedes asociar el mismo ítem más de una vez');
          return;
        }
        idsSet.add(Number(it.id_inventario));
      }
    }

    mutation.mutate({
      nombre: nombre.trim(),
      rut: rut.trim().toUpperCase(),
      correo: correo.trim(),
      num_tlf: numTlf.trim(),
      direccion: direccion.trim(),
      items: itemsAsociados.map((it) => ({
        id_inventario: Number(it.id_inventario),
        codigo_proveedor: it.codigo_proveedor.trim(),
        ultimo_monto_compra: it.ultimo_monto_compra !== '' ? Number(it.ultimo_monto_compra) : 0,
      })),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative bg-card border border-border/90 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
        {/* Overlay con spinner cuando está guardando */}
        {mutation.isPending && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2.5 animate-fadeIn">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Creando nuevo proveedor...
            </p>
          </div>
        )}

        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Registrar Nuevo Proveedor
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario rápido */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Nombre de la Empresa / Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Distribuidora de Climatización SpA"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                RUT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej: 77.987.654-3"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Teléfono</label>
              <input
                type="text"
                value={numTlf}
                onChange={(e) => setNumTlf(e.target.value)}
                placeholder="Ej: +56 2 2345 6789"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Correo de Ventas / Contacto</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ventas@proveedor.cl"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Dirección Casa Matriz / Bodega</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Panamericana Norte 5000, Quilicura"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Sección de Ítems del Catálogo del Proveedor */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  Ítems que este proveedor suministra (Opcional)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Asocia los ítems que vende este proveedor con su código y último costo
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setItemsAsociados((prev) => [
                    ...prev,
                    { id_inventario: '', codigo_proveedor: '', ultimo_monto_compra: '' },
                  ])
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Asociar Ítem
              </button>
            </div>

            {itemsAsociados.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground bg-muted/10">
                No hay ítems asociados. Puedes agregarlos ahora o dejarlos para después.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {itemsAsociados.map((itRow, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/70 items-center animate-fadeIn"
                  >
                    <div className="sm:col-span-5 space-y-0.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Ítem <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={inventario.map((inv) => ({
                          value: inv.id_inventario,
                          label: inv.nombre,
                          sublabel: `SKU: ${inv.sku || 'Sin SKU'} • ${inv.tipo}`,
                          searchTerms: `${inv.nombre} ${inv.sku || ''} ${inv.tipo}`,
                        }))}
                        value={itRow.id_inventario}
                        onChange={(val) => {
                          const numVal = val ? Number(val) : '';
                          setItemsAsociados((prev) => {
                            const next = [...prev];
                            next[idx].id_inventario = numVal;
                            if (numVal && !next[idx].codigo_proveedor) {
                              const sel = inventario.find((i) => i.id_inventario === numVal);
                              if (sel?.sku) next[idx].codigo_proveedor = sel.sku;
                            }
                            return next;
                          });
                        }}
                        placeholder="Selecciona ítem..."
                        searchPlaceholder="Buscar por nombre, SKU o tipo..."
                        required
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-0.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Cód. Proveedor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={itRow.codigo_proveedor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemsAsociados((prev) => {
                            const next = [...prev];
                            next[idx].codigo_proveedor = val;
                            return next;
                          });
                        }}
                        placeholder="Ej: 13703-2"
                        required
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Últ. Costo ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itRow.ultimo_monto_compra}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setItemsAsociados((prev) => {
                            const next = [...prev];
                            next[idx].ultimo_monto_compra = val;
                            return next;
                          });
                        }}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-center pt-2 sm:pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setItemsAsociados((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar asociación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Crear y Seleccionar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

