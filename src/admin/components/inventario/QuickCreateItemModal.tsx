import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Package, X, Save, Loader2, Plus, Building2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateItemAction } from '@/admin/actions/create-update-item.action';
import { getModelosAction } from '@/admin/actions/get-modelos.action';
import { getProveedoresAction } from '@/admin/actions/get-proveedores.action';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateModeloModal } from './QuickCreateModeloModal';

interface QuickCreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: InventarioItem) => void;
  defaultTipo?: 'insumo' | 'compresor' | 'valvula' | 'equipo';
  defaultProveedorId?: number;
}

interface ProveedorFila {
  id_proveedor: number | '';
  codigo_proveedor: string;
  ultimo_monto_compra: number | '';
}

export const QuickCreateItemModal: React.FC<QuickCreateItemModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultTipo = 'insumo',
  defaultProveedorId,
}) => {
  const queryClient = useQueryClient();

  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos-listado'],
    queryFn: getModelosAction,
    enabled: isOpen,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-select'],
    queryFn: getProveedoresAction,
    enabled: isOpen,
  });

  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'insumo' | 'compresor' | 'valvula' | 'equipo'>(defaultTipo);
  const [condicion, setCondicion] = useState<string>('NA');
  const [idModelo, setIdModelo] = useState<number | ''>('');
  const [isQuickModeloOpen, setIsQuickModeloOpen] = useState(false);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [porcentajeIva, setPorcentajeIva] = useState<number>(19);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(30);
  const [proveedoresAsociados, setProveedoresAsociados] = useState<ProveedorFila[]>([]);

  // Si se pasa defaultProveedorId, inicializar con ese proveedor
  useEffect(() => {
    if (isOpen) {
      if (defaultProveedorId) {
        setProveedoresAsociados([
          {
            id_proveedor: defaultProveedorId,
            codigo_proveedor: sku.trim() || '',
            ultimo_monto_compra: '',
          },
        ]);
      } else {
        setProveedoresAsociados([]);
      }
    }
  }, [isOpen, defaultProveedorId]);

  const mutation = useMutation({
    mutationFn: (payload: any) => createUpdateItemAction(payload),
    onSuccess: (nuevoItem) => {
      toast.success(`Ítem "${nuevoItem.nombre}" registrado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-catalogo'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-select'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-proveedores-listado'] });
      onCreated(nuevoItem);
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
      toast.error(err?.response?.data?.message || 'Error al crear el ítem');
    },
  });

  const handleReset = () => {
    setSku('');
    setNombre('');
    setTipo(defaultTipo);
    setCondicion(defaultTipo === 'insumo' || defaultTipo === 'equipo' ? 'NA' : 'nuevo');
    setIdModelo('');
    setStockMinimo(5);
    setPorcentajeIva(19);
    setPorcentajeGanancia(30);
    setProveedoresAsociados([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku.trim() || !nombre.trim()) {
      toast.warning('SKU y Nombre son obligatorios');
      return;
    }

    if (!idModelo) {
      toast.warning('Selecciona un modelo técnico');
      return;
    }

    // Validar proveedores si se agregaron
    for (let i = 0; i < proveedoresAsociados.length; i++) {
      const p = proveedoresAsociados[i];
      if (!p.id_proveedor) {
        toast.warning(`Fila #${i + 1}: Debe seleccionar un proveedor`);
        return;
      }
      if (!p.codigo_proveedor.trim()) {
        toast.warning(`Fila #${i + 1}: Ingrese el código de proveedor`);
        return;
      }
    }

    // Validar duplicados de proveedor
    const provsSet = new Set<number>();
    for (const p of proveedoresAsociados) {
      if (p.id_proveedor) {
        if (provsSet.has(Number(p.id_proveedor))) {
          toast.warning('No puedes asociar el mismo proveedor más de una vez');
          return;
        }
        provsSet.add(Number(p.id_proveedor));
      }
    }

    const payload: any = {
      id_modelo: Number(idModelo),
      sku: sku.trim().toUpperCase(),
      nombre: nombre.trim(),
      tipo,
      condicion: (tipo === 'insumo' || tipo === 'equipo') ? 'NA' : condicion,
      stock_minimo: Number(stockMinimo),
      porcentaje_iva: Number(porcentajeIva),
      porcentaje_ganancia: Number(porcentajeGanancia),
    };

    if (proveedoresAsociados.length > 0) {
      payload.proveedores = proveedoresAsociados.map((p) => ({
        id_proveedor: Number(p.id_proveedor),
        codigo_proveedor: p.codigo_proveedor.trim(),
        ultimo_monto_compra: p.ultimo_monto_compra !== '' ? Number(p.ultimo_monto_compra) : 0,
      }));
    } else if (defaultProveedorId) {
      payload.proveedores = [
        {
          id_proveedor: Number(defaultProveedorId),
          codigo_proveedor: sku.trim().toUpperCase(),
          ultimo_monto_compra: 0,
        },
      ];
    }

    mutation.mutate(payload);
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
              Registrando y homologando ítem...
            </p>
          </div>
        )}

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Crear Nuevo Ítem en Inventario
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: VAL-EXP-01"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Tipo de Ítem <span className="text-rose-500">*</span>
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setTipo(t);
                  setCondicion(t === 'insumo' || t === 'equipo' ? 'NA' : 'nuevo');
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer capitalize"
              >
                <option value="insumo">Insumo</option>
                <option value="valvula">Válvula</option>
                <option value="compresor">Compresor</option>
                <option value="equipo">Equipo</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Nombre Descriptivo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Válvula de Expansión Termostática R404A"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Modelo Técnico <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickModeloOpen(true)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Modelo
                </button>
              </div>
              <SearchableSelect
                options={modelos.map((m) => ({
                  value: m.id_modelo,
                  label: m.nombre,
                  sublabel: m.marca ? `Marca: ${m.marca.nombre}` : undefined,
                  searchTerms: `${m.nombre} ${m.marca?.nombre || ''}`,
                }))}
                value={idModelo}
                onChange={(val) => setIdModelo(val ? Number(val) : '')}
                placeholder="Selecciona modelo..."
                searchPlaceholder="Buscar por modelo o marca..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Condición</label>
              {tipo === 'insumo' || tipo === 'equipo' ? (
                <input
                  type="text"
                  disabled
                  value="NA"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-muted/40 border border-border/80 text-muted-foreground font-semibold"
                />
              ) : (
                <select
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer capitalize"
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="usado">Usado</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Stock Mínimo</label>
              <input
                type="number"
                min={0}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">% IVA</label>
              <input
                type="number"
                min={0}
                value={porcentajeIva}
                onChange={(e) => setPorcentajeIva(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">% Margen</label>
              <input
                type="number"
                min={0}
                value={porcentajeGanancia}
                onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Sección de Proveedores Asociados */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Proveedores que Suministran este Ítem
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Asocia los proveedores que comercializan este producto
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProveedoresAsociados((prev) => [
                    ...prev,
                    {
                      id_proveedor: '',
                      codigo_proveedor: sku.trim() || '',
                      ultimo_monto_compra: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Asociar Proveedor
              </button>
            </div>

            {proveedoresAsociados.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground bg-muted/10">
                No hay proveedores asociados a este ítem.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {proveedoresAsociados.map((pRow, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/70 items-center animate-fadeIn"
                  >
                    <div className="sm:col-span-5 space-y-0.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Proveedor <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={proveedores.map((prov) => ({
                          value: prov.id_proveedor,
                          label: prov.nombre,
                          sublabel: `RUT: ${prov.rut}`,
                          searchTerms: `${prov.nombre} ${prov.rut}`,
                        }))}
                        value={pRow.id_proveedor}
                        onChange={(val) => {
                          const numVal = val ? Number(val) : '';
                          setProveedoresAsociados((prev) => {
                            const next = [...prev];
                            next[idx].id_proveedor = numVal;
                            return next;
                          });
                        }}
                        placeholder="Selecciona proveedor..."
                        searchPlaceholder="Buscar por nombre o RUT..."
                        required
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-0.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Cód. Proveedor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pRow.codigo_proveedor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProveedoresAsociados((prev) => {
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
                        value={pRow.ultimo_monto_compra}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setProveedoresAsociados((prev) => {
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
                          setProveedoresAsociados((prev) => prev.filter((_, i) => i !== idx))
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
                  Crear Ítem
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <QuickCreateModeloModal
        isOpen={isQuickModeloOpen}
        onClose={() => setIsQuickModeloOpen(false)}
        onCreated={(nuevo) => setIdModelo(nuevo.id_modelo)}
      />
    </div>
  );
};
