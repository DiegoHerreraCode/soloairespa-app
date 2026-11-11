import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Wrench, Package, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { ServicioTallerItem } from '@/admin/interfaces/servicio-taller.interface';
import type {
  CreateOrdenReparacionInsumoPayload,
  CreateOrdenReparacionServicioPayload,
} from '@/admin/actions/create-orden.action';

export interface RepuestoConfigReparacionData {
  insumos: CreateOrdenReparacionInsumoPayload[];
  servicios: CreateOrdenReparacionServicioPayload[];
}

interface EditarReparacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nombreItem: string;
  serviceTag: string;
  initialInsumos: CreateOrdenReparacionInsumoPayload[];
  initialServicios: CreateOrdenReparacionServicioPayload[];
  catalogoInsumos: InventarioItem[];
  catalogoServicios: ServicioTallerItem[];
  onSave: (data: RepuestoConfigReparacionData) => void;
}

export const EditarReparacionModal: React.FC<EditarReparacionModalProps> = ({
  isOpen,
  onClose,
  nombreItem,
  serviceTag,
  initialInsumos,
  initialServicios,
  catalogoInsumos,
  catalogoServicios,
  onSave,
}) => {
  const [insumos, setInsumos] = useState<CreateOrdenReparacionInsumoPayload[]>([]);
  const [servicios, setServicios] = useState<CreateOrdenReparacionServicioPayload[]>([]);

  // Insumos disponibles en taller
  const insumosMap = useMemo(() => {
    return new Map<number, InventarioItem>(catalogoInsumos.map((i) => [i.id_inventario, i]));
  }, [catalogoInsumos]);

  // Servicios disponibles
  const serviciosMap = useMemo(() => {
    return new Map<number, ServicioTallerItem>(
      catalogoServicios.map((s) => [s.id_servicio_taller, s])
    );
  }, [catalogoServicios]);

  // Función de cálculo para insumo (idéntica a ReparacionFormPage)
  const calcularValoresInsumo = (
    itemInv: InventarioItem,
    costoUnitarioInput?: number,
    porcentajeGananciaInput?: number,
    costoConGananciaInput?: number
  ) => {
    const costoUnit =
      costoUnitarioInput !== undefined
        ? costoUnitarioInput
        : Number(itemInv.monto_compra_prom || 0);

    let pctGan =
      porcentajeGananciaInput !== undefined
        ? porcentajeGananciaInput
        : Number(itemInv.porcentaje_ganancia || 0);

    let costoConGan = 0;

    if (costoConGananciaInput !== undefined) {
      costoConGan = Number(costoConGananciaInput.toFixed(2));
      if (costoConGan > 0 && costoUnit > 0) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      } else {
        pctGan = 0;
      }
    } else if (porcentajeGananciaInput !== undefined) {
      costoConGan =
        pctGan > 0 && pctGan < 100
          ? Number((costoUnit / (1 - pctGan / 100)).toFixed(2))
          : Number(costoUnit.toFixed(2));
    } else {
      if (itemInv.monto_venta_unitario !== undefined && itemInv.monto_venta_unitario !== null) {
        costoConGan = Number(Number(itemInv.monto_venta_unitario).toFixed(2));
      } else {
        costoConGan =
          pctGan > 0 && pctGan < 100
            ? Number((costoUnit / (1 - pctGan / 100)).toFixed(2))
            : Number(costoUnit.toFixed(2));
      }
    }

    const pctIva = Number(itemInv.porcentaje_iva !== undefined ? itemInv.porcentaje_iva : 19);

    return {
      costo_unitario: Number(costoUnit.toFixed(2)),
      porcentaje_ganancia: pctGan,
      costo_unitario_con_ganancia: costoConGan,
      porcentaje_iva: pctIva,
    };
  };

  // Función de cálculo para servicio (idéntica a ReparacionFormPage)
  const calcularValoresServicio = (
    servCat: ServicioTallerItem,
    costoUnitarioInput?: number,
    porcentajeGananciaInput?: number,
    costoConGananciaInput?: number
  ) => {
    const costoUnit =
      costoUnitarioInput !== undefined ? costoUnitarioInput : Number(servCat.costo_base || 0);

    let pctGan =
      porcentajeGananciaInput !== undefined
        ? porcentajeGananciaInput
        : Number(servCat.porcentaje_ganancia || 0);

    let costoConGan = 0;

    if (costoConGananciaInput !== undefined) {
      costoConGan = Number(costoConGananciaInput.toFixed(2));
      if (costoConGan > 0 && costoUnit > 0) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      } else {
        pctGan = 0;
      }
    } else if (porcentajeGananciaInput !== undefined) {
      costoConGan =
        pctGan > 0 && pctGan < 100
          ? Number((costoUnit / (1 - pctGan / 100)).toFixed(2))
          : Number(costoUnit.toFixed(2));
    } else {
      if (servCat.monto_venta_unitario !== undefined && servCat.monto_venta_unitario !== null) {
        costoConGan = Number(Number(servCat.monto_venta_unitario).toFixed(2));
      } else {
        costoConGan =
          pctGan > 0 && pctGan < 100
            ? Number((costoUnit / (1 - pctGan / 100)).toFixed(2))
            : Number(costoUnit.toFixed(2));
      }
    }

    const pctIva = Number(servCat.porcentaje_iva !== undefined ? servCat.porcentaje_iva : 19);

    return {
      costo_unitario: Number(costoUnit.toFixed(2)),
      porcentaje_ganancia: pctGan,
      costo_unitario_con_ganancia: costoConGan,
      porcentaje_iva: pctIva,
    };
  };

  useEffect(() => {
    if (isOpen) {
      // Normalizar insumos iniciales a máximo 2 decimales
      const insumosInit = (initialInsumos || []).map((ins) => {
        const itemInv = insumosMap.get(ins.id_inventario);
        const costoUnit = Number(Number(itemInv?.monto_compra_prom ?? ins.costo_unitario ?? 0).toFixed(2));
        const costoConGan =
          ins.costo_unitario_con_ganancia !== undefined && ins.costo_unitario_con_ganancia !== null
            ? Number(Number(ins.costo_unitario_con_ganancia).toFixed(2))
            : itemInv?.monto_venta_unitario !== undefined && itemInv?.monto_venta_unitario !== null
            ? Number(Number(itemInv.monto_venta_unitario).toFixed(2))
            : costoUnit;

        let pctGan = Number(Number(ins.porcentaje_ganancia ?? itemInv?.porcentaje_ganancia ?? 0).toFixed(2));
        if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
          pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
        }

        return {
          id_inventario: ins.id_inventario,
          cantidad: Number(ins.cantidad) || 1,
          costo_unitario: costoUnit,
          porcentaje_ganancia: pctGan,
          costo_unitario_con_ganancia: costoConGan,
          porcentaje_iva: Number(Number(ins.porcentaje_iva ?? itemInv?.porcentaje_iva ?? 19).toFixed(2)),
        };
      });

      // Normalizar servicios iniciales a máximo 2 decimales
      const serviciosInit = (initialServicios || []).map((srv) => {
        const servCat = serviciosMap.get(srv.id_servicio_taller);
        const costoUnit = Number(Number(servCat?.costo_base ?? srv.costo_unitario ?? 0).toFixed(2));
        const costoConGan =
          srv.costo_unitario_con_ganancia !== undefined && srv.costo_unitario_con_ganancia !== null
            ? Number(Number(srv.costo_unitario_con_ganancia).toFixed(2))
            : servCat?.monto_venta_unitario !== undefined && servCat?.monto_venta_unitario !== null
            ? Number(Number(servCat.monto_venta_unitario).toFixed(2))
            : costoUnit;

        let pctGan = Number(Number(srv.porcentaje_ganancia ?? servCat?.porcentaje_ganancia ?? 0).toFixed(2));
        if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
          pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
        }

        return {
          id_servicio_taller: srv.id_servicio_taller,
          cantidad: Number(srv.cantidad) || 1,
          costo_unitario: costoUnit,
          porcentaje_ganancia: pctGan,
          costo_unitario_con_ganancia: costoConGan,
          porcentaje_iva: Number(Number(srv.porcentaje_iva ?? 19).toFixed(2)),
        };
      });

      setInsumos(insumosInit);
      setServicios(serviciosInit);
    }
  }, [isOpen, initialInsumos, initialServicios, insumosMap, serviciosMap]);

  if (!isOpen) return null;

  // Manejo de insumos
  const handleAddInsumo = () => {
    const seleccionadoIds = new Set(insumos.map((i) => i.id_inventario));
    const disponible = catalogoInsumos.find((i) => !seleccionadoIds.has(i.id_inventario));
    if (!disponible) {
      toast.warning('Todos los insumos del catálogo ya están agregados');
      return;
    }

    const calculos = calcularValoresInsumo(disponible);

    setInsumos((prev) => [
      ...prev,
      {
        id_inventario: disponible.id_inventario,
        cantidad: 1,
        ...calculos,
      },
    ]);
  };

  const handleUpdateInsumo = (
    index: number,
    campo: 'id_inventario' | 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia',
    valor: any
  ) => {
    setInsumos((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const idInv = campo === 'id_inventario' ? Number(valor) : target.id_inventario;
      const itemInv = insumosMap.get(idInv);
      if (!itemInv) return prev;

      if (campo === 'id_inventario') {
        const calculos = calcularValoresInsumo(itemInv);
        updated[index] = {
          id_inventario: idInv,
          cantidad: target.cantidad,
          ...calculos,
        };
        return updated;
      }

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, Number(valor) || 1) : target.cantidad;
      const nuevoPctGan =
        campo === 'porcentaje_ganancia'
          ? Math.max(0, Math.min(99.99, Number(valor) || 0))
          : undefined;
      const nuevoCostoConGan =
        campo === 'costo_unitario_con_ganancia' ? Math.max(0, Number(valor) || 0) : undefined;

      const nuevosCalculos = calcularValoresInsumo(
        itemInv,
        target.costo_unitario,
        nuevoPctGan !== undefined
          ? nuevoPctGan
          : campo === 'costo_unitario_con_ganancia'
          ? undefined
          : target.porcentaje_ganancia,
        nuevoCostoConGan
      );

      updated[index] = {
        ...target,
        cantidad: nuevaCantidad,
        ...nuevosCalculos,
      };

      return updated;
    });
  };

  const handleRemoveInsumo = (index: number) => {
    setInsumos((prev) => prev.filter((_, i) => i !== index));
  };

  // Manejo de servicios
  const handleAddServicio = () => {
    const seleccionadoIds = new Set(servicios.map((s) => s.id_servicio_taller));
    const disponible = catalogoServicios.find((s) => !seleccionadoIds.has(s.id_servicio_taller));
    if (!disponible) {
      toast.warning('Todos los servicios del catálogo ya están agregados');
      return;
    }

    const calculos = calcularValoresServicio(disponible);

    setServicios((prev) => [
      ...prev,
      {
        id_servicio_taller: disponible.id_servicio_taller,
        cantidad: 1,
        ...calculos,
      },
    ]);
  };

  const handleUpdateServicio = (
    index: number,
    campo: 'id_servicio_taller' | 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia',
    valor: any
  ) => {
    setServicios((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const idSrv = campo === 'id_servicio_taller' ? Number(valor) : target.id_servicio_taller;
      const servCat = serviciosMap.get(idSrv);
      if (!servCat) return prev;

      if (campo === 'id_servicio_taller') {
        const calculos = calcularValoresServicio(servCat);
        updated[index] = {
          id_servicio_taller: idSrv,
          cantidad: target.cantidad,
          ...calculos,
        };
        return updated;
      }

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, Number(valor) || 1) : target.cantidad;
      const nuevoPctGan =
        campo === 'porcentaje_ganancia'
          ? Math.max(0, Math.min(99.99, Number(valor) || 0))
          : undefined;
      const nuevoCostoConGan =
        campo === 'costo_unitario_con_ganancia' ? Math.max(0, Number(valor) || 0) : undefined;

      const nuevosCalculos = calcularValoresServicio(
        servCat,
        target.costo_unitario,
        nuevoPctGan !== undefined
          ? nuevoPctGan
          : campo === 'costo_unitario_con_ganancia'
          ? undefined
          : target.porcentaje_ganancia,
        nuevoCostoConGan
      );

      updated[index] = {
        ...target,
        cantidad: nuevaCantidad,
        ...nuevosCalculos,
      };

      return updated;
    });
  };

  const handleRemoveServicio = (index: number) => {
    setServicios((prev) => prev.filter((_, i) => i !== index));
  };

  // Totales de la reparación en el modal con máximo 2 decimales
  const subtotalNeto = useMemo(() => {
    let tot = 0;
    insumos.forEach((i) => {
      tot += Number(i.cantidad || 0) * Number(i.costo_unitario_con_ganancia || 0);
    });
    servicios.forEach((s) => {
      tot += Number(s.cantidad || 0) * Number(s.costo_unitario_con_ganancia || 0);
    });
    return Number(tot.toFixed(2));
  }, [insumos, servicios]);

  const handleSaveModal = () => {
    // Validar duplicados de insumos
    const insumoIds = insumos.map((i) => i.id_inventario);
    if (new Set(insumoIds).size !== insumoIds.length) {
      toast.error('Hay insumos duplicados en la lista de esta reparación');
      return;
    }

    // Validar duplicados de servicios
    const servicioIds = servicios.map((s) => s.id_servicio_taller);
    if (new Set(servicioIds).size !== servicioIds.length) {
      toast.error('Hay servicios duplicados en la lista de esta reparación');
      return;
    }

    onSave({
      insumos,
      servicios,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-card w-full max-w-5xl rounded-2xl border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-accent/20">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-500" />
              Configurar Insumos y Servicios de Reparación
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pieza: <span className="font-semibold text-foreground">{nombreItem}</span> | Service Tag:{' '}
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {serviceTag}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECCIÓN 1: INSUMOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                Insumos Requeridos ({insumos.length})
              </h3>
              <button
                type="button"
                onClick={handleAddInsumo}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Insumo
              </button>
            </div>

            {insumos.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground bg-accent/10">
                No hay insumos asignados a esta reparación. Puedes agregar insumos usando el botón superior.
              </div>
            ) : (
              <div className="space-y-2">
                {insumos.map((ins, idx) => {
                  const inv = insumosMap.get(ins.id_inventario);
                  const stockDisponible = inv ? inv.cantidad_propia : 0;
                  const isStockExceeded = ins.cantidad > stockDisponible;
                  const subtotalLinea =
                    Number(ins.cantidad || 0) * Number(ins.costo_unitario_con_ganancia || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/80 bg-accent/20 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      {/* Select Inteligente de Insumo */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Insumo
                        </label>
                        <SearchableSelect
                          options={catalogoInsumos.map((ci) => ({
                            value: ci.id_inventario,
                            label: ci.nombre,
                            sublabel: `Stock: ${ci.cantidad_propia} | SKU: ${ci.sku || 'S/N'}`,
                            searchTerms: `${ci.sku || ''} ${ci.nombre}`,
                          }))}
                          value={ins.id_inventario}
                          onChange={(val) =>
                            handleUpdateInsumo(idx, 'id_inventario', Number(val))
                          }
                          placeholder="Buscar insumo..."
                          searchPlaceholder="Filtrar por nombre o SKU..."
                        />
                      </div>

                      {/* Cantidad */}
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={ins.cantidad}
                          onChange={(e) =>
                            handleUpdateInsumo(idx, 'cantidad', Number(e.target.value))
                          }
                          className={`w-full px-2 py-1.5 text-xs text-center rounded-xl bg-background border font-mono ${
                            isStockExceeded
                              ? 'border-rose-500 text-rose-600 focus:ring-rose-500'
                              : 'border-border/80 text-foreground'
                          }`}
                        />
                        {isStockExceeded && (
                          <span className="text-[8px] text-rose-500 block font-semibold text-center leading-tight">
                            Excede ({stockDisponible})
                          </span>
                        )}
                      </div>

                      {/* Porcentaje Ganancia (%) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
                          % Ganancia
                        </label>
                        <div className="inline-flex items-center gap-1 w-full justify-center">
                          <input
                            type="number"
                            min={0}
                            max={99.99}
                            step="any"
                            value={ins.porcentaje_ganancia ?? 0}
                            onChange={(e) =>
                              handleUpdateInsumo(
                                idx,
                                'porcentaje_ganancia',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs text-right rounded-xl border border-border/80 bg-background text-foreground font-mono"
                          />
                          <span className="text-muted-foreground text-xs font-semibold">%</span>
                        </div>
                      </div>

                      {/* Costo con Ganancia (Precio Unitario) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
                          Costo Con Ganancia
                        </label>
                        <div className="inline-flex items-center gap-1 w-full justify-center">
                          <span className="text-muted-foreground text-xs font-semibold">$</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={ins.costo_unitario_con_ganancia ?? 0}
                            onChange={(e) =>
                              handleUpdateInsumo(
                                idx,
                                'costo_unitario_con_ganancia',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-xl border border-border/80 bg-background text-foreground font-mono"
                          />
                        </div>
                      </div>

                      {/* Precio Venta Subtotal */}
                      <div className="sm:col-span-2 space-y-1 text-right">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Venta Subtotal
                        </label>
                        <span className="font-mono font-bold text-xs text-foreground block">
                          ${subtotalLinea.toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">
                          Unit: ${Number(ins.costo_unitario_con_ganancia || 0).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Botón Eliminar */}
                      <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveInsumo(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar insumo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: SERVICIOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-500" />
                Servicios del Taller ({servicios.length})
              </h3>
              <button
                type="button"
                onClick={handleAddServicio}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Servicio
              </button>
            </div>

            {servicios.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground bg-accent/10">
                No hay servicios de mano de obra asignados a esta reparación.
              </div>
            ) : (
              <div className="space-y-2">
                {servicios.map((srv, idx) => {
                  const subtotalLinea =
                    Number(srv.cantidad || 0) * Number(srv.costo_unitario_con_ganancia || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/80 bg-accent/20 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      {/* Select Inteligente de Servicio */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Servicio
                        </label>
                        <SearchableSelect
                          options={catalogoServicios.map((cs) => ({
                            value: cs.id_servicio_taller,
                            label: cs.nombre,
                            sublabel: `Costo base: $${Number(cs.costo_base || 0).toLocaleString('es-CL')}`,
                            searchTerms: `${cs.nombre}`,
                          }))}
                          value={srv.id_servicio_taller}
                          onChange={(val) =>
                            handleUpdateServicio(idx, 'id_servicio_taller', Number(val))
                          }
                          placeholder="Buscar servicio..."
                          searchPlaceholder="Filtrar por nombre..."
                        />
                      </div>

                      {/* Cantidad */}
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={srv.cantidad}
                          onChange={(e) =>
                            handleUpdateServicio(idx, 'cantidad', Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 text-xs text-center rounded-xl bg-background border border-border/80 text-foreground font-mono"
                        />
                      </div>

                      {/* Porcentaje Ganancia (%) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
                          % Ganancia
                        </label>
                        <div className="inline-flex items-center gap-1 w-full justify-center">
                          <input
                            type="number"
                            min={0}
                            max={99.99}
                            step="any"
                            value={srv.porcentaje_ganancia ?? 0}
                            onChange={(e) =>
                              handleUpdateServicio(
                                idx,
                                'porcentaje_ganancia',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs text-right rounded-xl border border-border/80 bg-background text-foreground font-mono"
                          />
                          <span className="text-muted-foreground text-xs font-semibold">%</span>
                        </div>
                      </div>

                      {/* Costo con Ganancia (Precio Unitario) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
                          Costo Con Ganancia
                        </label>
                        <div className="inline-flex items-center gap-1 w-full justify-center">
                          <span className="text-muted-foreground text-xs font-semibold">$</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={srv.costo_unitario_con_ganancia ?? 0}
                            onChange={(e) =>
                              handleUpdateServicio(
                                idx,
                                'costo_unitario_con_ganancia',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-xl border border-border/80 bg-background text-foreground font-mono"
                          />
                        </div>
                      </div>

                      {/* Precio Venta Subtotal */}
                      <div className="sm:col-span-2 space-y-1 text-right">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                          Venta Subtotal
                        </label>
                        <span className="font-mono font-bold text-xs text-foreground block">
                          ${subtotalLinea.toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">
                          Unit: ${Number(srv.costo_unitario_con_ganancia || 0).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Botón Eliminar */}
                      <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveServicio(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pie con totales y acciones */}
        <div className="px-6 py-4 border-t border-border/80 bg-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-bold">
              Subtotal Reparación (Neto):
            </span>
            <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">
              ${subtotalNeto.toLocaleString('es-CL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveModal}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
