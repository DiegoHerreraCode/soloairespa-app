import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Package, X, Save, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateItemAction } from '@/admin/actions/create-update-item.action';
import { getModelosAction } from '@/admin/actions/get-modelos.action';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import { QuickCreateModeloModal } from './QuickCreateModeloModal';

interface QuickCreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: InventarioItem) => void;
  defaultTipo?: 'insumo' | 'compresor' | 'valvula' | 'equipo';
  defaultProveedorId?: number;
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

  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'insumo' | 'compresor' | 'valvula' | 'equipo'>(defaultTipo);
  const [condicion, setCondicion] = useState<string>('NA');
  const [idModelo, setIdModelo] = useState<number | ''>('');
  const [isQuickModeloOpen, setIsQuickModeloOpen] = useState(false);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [porcentajeIva, setPorcentajeIva] = useState<number>(19);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(30);

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

    if (defaultProveedorId) {
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
      <div className="relative bg-card border border-border/90 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 overflow-hidden">
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
              <select
                required
                value={idModelo}
                onChange={(e) => setIdModelo(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
              >
                <option value="">Selecciona modelo...</option>
                {modelos.map((m) => (
                  <option key={m.id_modelo} value={m.id_modelo}>
                    {m.nombre} {m.marca ? `(${m.marca.nombre})` : ''}
                  </option>
                ))}
              </select>
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
