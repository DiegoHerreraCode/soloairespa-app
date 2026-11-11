import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Calendar,
  Copy,
  Wrench,
  Package,
  Sliders,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { getRepuestosAction } from '@/admin/actions/get-repuestos.action';
import { getServiciosTallerAction } from '@/admin/actions/get-servicios-taller.action';
import { getInventarioReparacionBaseAction } from '@/admin/actions/inventario-reparacion-base.action';
import {
  createOrdenAction,
  type CreateOrdenReparacionPayload,
  type CreateOrdenReparacionInsumoPayload,
  type CreateOrdenReparacionServicioPayload,
} from '@/admin/actions/create-orden.action';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateClienteModal } from '@/admin/components/clientes/QuickCreateClienteModal';
import { QuickCreateItemModal } from '@/admin/components/inventario/QuickCreateItemModal';
import {
  EditarReparacionModal,
  type RepuestoConfigReparacionData,
} from '@/admin/components/ordenes/EditarReparacionModal';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';
import type { RepuestoItem } from '@/admin/interfaces/repuesto.interface';
import type { ServicioTallerItem } from '@/admin/interfaces/servicio-taller.interface';
import { generarServiceTagUnico } from '@/admin/utils/service-tag-generator';

export interface RepuestoEntranteFila {
  id: string; // id temporal único para control en React
  id_inventario: number | '';
  serial: string;
  service_tag: string;
  monto_base: number;
  insumos: CreateOrdenReparacionInsumoPayload[];
  servicios: CreateOrdenReparacionServicioPayload[];
}

export const OrdenReparacionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Cargar Inventario
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Cargar Tipos de Órdenes (para resolver id_tipo_orden de 'reparacion')
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // 4. Cargar repuestos existentes en BD para garantizar unicidad global de service_tag
  const { data: repuestosStock = [] } = useQuery<RepuestoItem[]>({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
  });

  // 5. Cargar Servicios de Taller
  const { data: serviciosTaller = [], isLoading: isLoadingServicios } = useQuery<ServicioTallerItem[]>({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
  });

  // Conjunto de service_tags existentes en base de datos
  const existingServiceTagsSet = useMemo(() => {
    const set = new Set<string>();
    repuestosStock.forEach((r) => {
      if (r.service_tag) set.add(r.service_tag.toLowerCase().trim());
    });
    return set;
  }, [repuestosStock]);

  // Catálogo permitido para reparación en taller: compresores y válvulas usados
  const inventarioPermitido = useMemo(() => {
    return inventario.filter((item) => {
      const t = item.tipo;
      const c = item.condicion;
      return (t === 'compresor' || t === 'valvula') && c === 'usado';
    });
  }, [inventario]);

  // Mapa de inventario para lookup rápido
  const inventarioMap = useMemo(() => {
    return new Map<number, InventarioItem>(inventario.map((i) => [i.id_inventario, i]));
  }, [inventario]);

  // Catálogo de solo insumos
  const catalogoInsumos = useMemo(() => {
    return inventario.filter((i) => i.tipo === 'insumo');
  }, [inventario]);

  // Estado del cliente seleccionado
  const [idCliente, setIdCliente] = useState<number | ''>('');
  const [isQuickClienteOpen, setIsQuickClienteOpen] = useState(false);
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [quickItemTargetIndex, setQuickItemTargetIndex] = useState<number | null>(null);

  // Modal para editar insumos y servicios de un repuesto específico
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Fecha estimada de entrega de reparación
  const [fechaEntregaReparacion, setFechaEntregaReparacion] = useState<string>('');

  // Estado para el serial de "Aplicar a todos" en la orden de reparación
  const [bulkSerialOrden, setBulkSerialOrden] = useState<string>('');

  // Repuestos entrantes inicializados con 1 fila por defecto según el boceto
  const [repuestosEntrantes, setRepuestosEntrantes] = useState<RepuestoEntranteFila[]>(() => {
    const defaultTag = generarServiceTagUnico('compresor');
    return [
      {
        id: crypto.randomUUID(),
        id_inventario: '',
        serial: defaultTag,
        service_tag: defaultTag,
        monto_base: 0,
        insumos: [],
        servicios: [],
      },
    ];
  });

  // Resolución del id_tipo_orden de 'reparacion' (id 2)
  const idTipoOrdenReparacion = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'reparacion');
    return tipo ? tipo.id_tipo_orden : 2;
  }, [tiposOrdenes]);

  // Obtener un conjunto combinado de service_tags actuales (BD + filas)
  const getCombinedServiceTagsSet = () => {
    const set = new Set<string>(existingServiceTagsSet);
    repuestosEntrantes.forEach((r) => {
      if (r.service_tag) set.add(r.service_tag.toLowerCase().trim());
    });
    return set;
  };

  // Agregar una nueva fila de repuesto entrante (+)
  const handleAgregarFila = () => {
    const currentTags = getCombinedServiceTagsSet();
    const defaultTag = generarServiceTagUnico('compresor', currentTags);
    setRepuestosEntrantes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        id_inventario: '',
        serial: defaultTag,
        service_tag: defaultTag,
        monto_base: 0,
        insumos: [],
        servicios: [],
      },
    ]);
  };

  // Aplicar serial masivo a todas las filas de la orden de reparación
  const handleApplySerialToAll = () => {
    const val = bulkSerialOrden.trim();
    if (!val) {
      toast.warning('Ingresa un serial para aplicar a todas las piezas');
      return;
    }

    setRepuestosEntrantes((prev) =>
      prev.map((r) => ({
        ...r,
        serial: val,
      }))
    );

    toast.success(`Serial "${val}" aplicado a todas las piezas`);
  };

  // Remover fila de repuesto entrante (X)
  const handleRemoverFila = (id: string) => {
    if (repuestosEntrantes.length <= 1) {
      toast.warning('Debe existir al menos un repuesto entrante a reparar');
      return;
    }
    setRepuestosEntrantes((prev) => prev.filter((r) => r.id !== id));
  };

  // Cuando se selecciona un ítem de inventario en una fila, cargar su configuración base
  const handleSeleccionarItem = async (index: number, idInventario: number | '') => {
    if (!idInventario) {
      setRepuestosEntrantes((prev) => {
        const actual = [...prev];
        actual[index] = {
          ...actual[index],
          id_inventario: '',
          monto_base: 0,
          insumos: [],
          servicios: [],
        };
        return actual;
      });
      return;
    }

    const item = inventarioMap.get(idInventario);
    let baseMonto = Number(item?.monto_venta_reparacion_base || 0);

    // Actualizar temporalmente con el ítem
    setRepuestosEntrantes((prev) => {
      const actual = [...prev];
      actual[index] = {
        ...actual[index],
        id_inventario: idInventario,
        monto_base: baseMonto,
      };
      return actual;
    });

    // Consultar el endpoint de reparación base
    try {
      const baseData = await getInventarioReparacionBaseAction(idInventario);
      if (baseData) {
        const insumosPayload: CreateOrdenReparacionInsumoPayload[] = baseData.insumos.map((i) => ({
          id_inventario: i.id_inventario_insumo,
          cantidad: Number(i.cantidad) || 1,
          costo_unitario: Number(i.costo_unitario || 0),
          costo_unitario_con_ganancia: Number(i.costo_unitario_con_ganancia || 0),
          porcentaje_iva: Number(i.porcentaje_iva ?? 19),
        }));

        const serviciosPayload: CreateOrdenReparacionServicioPayload[] = baseData.servicios.map((s) => ({
          id_servicio_taller: s.id_servicio_taller,
          cantidad: Number(s.cantidad) || 1,
          costo_unitario: Number(s.costo_unitario || 0),
          costo_unitario_con_ganancia: Number(s.costo_unitario_con_ganancia || 0),
          porcentaje_iva: Number(s.porcentaje_iva ?? 19),
        }));

        setRepuestosEntrantes((prev) => {
          const actual = [...prev];
          actual[index] = {
            ...actual[index],
            monto_base: Number(baseData.monto_venta_reparacion_base || 0),
            insumos: insumosPayload,
            servicios: serviciosPayload,
          };
          return actual;
        });
      }
    } catch (e) {
      console.error('Error al cargar base de reparación:', e);
    }
  };

  // Actualizar campo simple de una fila
  const handleActualizarCampo = (
    index: number,
    campo: 'serial' | 'service_tag',
    valor: string
  ) => {
    setRepuestosEntrantes((prev) => {
      const actual = [...prev];
      actual[index] = {
        ...actual[index],
        [campo]: valor,
      };
      return actual;
    });
  };

  // Guardar insumos y servicios personalizados desde el modal
  const handleSaveModalReparacion = (data: RepuestoConfigReparacionData) => {
    if (editingIndex === null) return;

    let subtotalConGanancia = 0;
    data.insumos.forEach((i) => {
      subtotalConGanancia += Number(i.cantidad || 0) * Number(i.costo_unitario_con_ganancia || 0);
    });
    data.servicios.forEach((s) => {
      subtotalConGanancia += Number(s.cantidad || 0) * Number(s.costo_unitario_con_ganancia || 0);
    });

    setRepuestosEntrantes((prev) => {
      const actual = [...prev];
      actual[editingIndex] = {
        ...actual[editingIndex],
        insumos: data.insumos,
        servicios: data.servicios,
        monto_base: subtotalConGanancia,
      };
      return actual;
    });
  };

  // Cálculos totales consolidados en tiempo real para la orden
  const { totalGravado, totalExento, totalIva, totalGeneral } = useMemo(() => {
    let gravado = 0;
    let exento = 0;
    let iva = 0;

    repuestosEntrantes.forEach((r) => {
      const item = r.id_inventario ? inventarioMap.get(r.id_inventario) : null;
      const pctIva = Number(item?.porcentaje_iva ?? 19);

      let subtotalPieza = 0;
      r.insumos.forEach((ins) => {
        subtotalPieza += Number(ins.cantidad || 0) * Number(ins.costo_unitario_con_ganancia || 0);
      });
      r.servicios.forEach((srv) => {
        subtotalPieza += Number(srv.cantidad || 0) * Number(srv.costo_unitario_con_ganancia || 0);
      });

      // Si no tiene insumos ni servicios configurados pero tiene monto_base
      if (subtotalPieza === 0 && r.monto_base > 0) {
        subtotalPieza = r.monto_base;
      }

      subtotalPieza = Number(subtotalPieza.toFixed(2));
      const ivaPieza = pctIva > 0 ? Number((subtotalPieza * (pctIva / 100)).toFixed(2)) : 0;

      if (pctIva > 0) {
        gravado += subtotalPieza;
      } else {
        exento += subtotalPieza;
      }
      iva += ivaPieza;
    });

    const finalGravado = Number(gravado.toFixed(2));
    const finalExento = Number(exento.toFixed(2));
    const finalIva = Number(iva.toFixed(2));
    const finalGeneral = Number((finalGravado + finalExento + finalIva).toFixed(2));

    return {
      totalGravado: finalGravado,
      totalExento: finalExento,
      totalIva: finalIva,
      totalGeneral: finalGeneral,
    };
  }, [repuestosEntrantes, inventarioMap]);

  // Validación de stock acumulado de insumos entre todas las reparaciones
  const insumosStockValidation = useMemo(() => {
    const demanda: Record<number, number> = {};
    repuestosEntrantes.forEach((r) => {
      r.insumos.forEach((ins) => {
        demanda[ins.id_inventario] = (demanda[ins.id_inventario] || 0) + Number(ins.cantidad || 0);
      });
    });

    const fallas: string[] = [];
    Object.entries(demanda).forEach(([idStr, cantReq]) => {
      const idInv = Number(idStr);
      const inv = inventarioMap.get(idInv);
      const disponible = inv ? inv.cantidad_propia : 0;
      if (cantReq > disponible) {
        fallas.push(
          `"${inv?.nombre || `Ítem #${idInv}`}": requerido en total ${cantReq}, disponible ${disponible}`
        );
      }
    });

    return fallas;
  }, [repuestosEntrantes, inventarioMap]);

  // Mutación para crear la Orden de Reparación
  const createOrdenMutation = useMutation({
    mutationFn: (payload: CreateOrdenReparacionPayload) => createOrdenAction(payload),
    onSuccess: (ordenCreada) => {
      toast.success(
        `Orden de Reparación #${ordenCreada?.id_orden || ''} registrada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-catalogo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/admin/ordenes/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la orden de reparación';
      toast.error(msg);
    },
  });

  // Manejo del envío del formulario con validaciones
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente) {
      toast.warning('Debe seleccionar un cliente para la orden');
      return;
    }

    if (!fechaEntregaReparacion) {
      toast.warning('Debe indicar la fecha estimada de entrega de la reparación');
      return;
    }

    if (repuestosEntrantes.length === 0) {
      toast.warning('Debe registrar al menos un repuesto entrante');
      return;
    }

    // 1. Validar campos requeridos en cada fila
    for (let i = 0; i < repuestosEntrantes.length; i++) {
      const r = repuestosEntrantes[i];
      const numFila = i + 1;

      if (!r.id_inventario) {
        toast.warning(`En la fila #${numFila}, debe seleccionar el modelo de repuesto entrante`);
        return;
      }

      if (!r.serial.trim()) {
        toast.warning(`En la fila #${numFila}, debe ingresar el número de serie (serial)`);
        return;
      }

      if (!r.service_tag.trim()) {
        toast.warning(`En la fila #${numFila}, debe ingresar el service_tag del repuesto`);
        return;
      }
    }

    // 2. Validar que no existan service_tags repetidos
    const serviceTags = repuestosEntrantes.map((r) => r.service_tag.trim().toLowerCase());
    const serviceTagsSet = new Set(serviceTags);
    if (serviceTagsSet.size !== serviceTags.length) {
      toast.error('No pueden haber service_tag iguales entre los repuestos entrantes.');
      return;
    }

    // 3. Validar disponibilidad de stock acumulado de insumos
    if (insumosStockValidation.length > 0) {
      toast.error(
        `Stock insuficiente de insumos para procesar las reparaciones:\n${insumosStockValidation.join(
          '\n'
        )}`
      );
      return;
    }

    // 4. Construcción del Payload con insumos y servicios asociados
    const payload: CreateOrdenReparacionPayload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenReparacion),
      fecha_entrega_reparacion: fechaEntregaReparacion,
      repuestos_entrantes: repuestosEntrantes.map((r) => ({
        id_inventario: Number(r.id_inventario),
        serial: r.serial.trim(),
        service_tag: r.service_tag.trim(),
        insumos: r.insumos,
        servicios: r.servicios,
      })),
    };

    createOrdenMutation.mutate(payload);
  };

  const isLoadingGlobal = isLoadingClientes || isLoadingInventario || isLoadingTiposOrdenes || isLoadingServicios;

  if (isLoadingGlobal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Cargando formulario de orden de reparación...</p>
        </div>
      </div>
    );
  }

  const filaEnEdicion = editingIndex !== null ? repuestosEntrantes[editingIndex] : null;
  const itemEnEdicion =
    filaEnEdicion && filaEnEdicion.id_inventario ? inventarioMap.get(filaEnEdicion.id_inventario) : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-5xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Registrar Nueva Orden de Reparación
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Recepción e ingreso de equipos del cliente al taller con cálculo económico anticipado de insumos y servicios
          </p>
        </div>

        <Link
          to="/admin/ordenes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. SELECTOR DE CLIENTE Y FECHA ENTREGA REPARACIÓN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Selector de Cliente */}
          <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Seleccione al Cliente <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsQuickClienteOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Cliente
              </button>
            </div>
            <SearchableSelect
              options={clientes.map((c) => ({
                value: c.id_cliente,
                label: c.nombre,
                sublabel: c.rut ? `RUT: ${c.rut}` : undefined,
                searchTerms: `${c.rut || ''}`,
              }))}
              value={idCliente}
              onChange={(val) => setIdCliente(val ? Number(val) : '')}
              placeholder="Seleccione al Cliente"
              searchPlaceholder="Buscar por nombre o RUT..."
              required
            />
          </div>

          {/* Fecha Entrega Reparación */}
          <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Fecha Entrega Reparación <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={fechaEntregaReparacion}
              onChange={(e) => setFechaEntregaReparacion(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
            />
          </div>
        </div>

        {/* ALERTA DE STOCK INSUFICIENTE GLOBAL SI APLICA */}
        {insumosStockValidation.length > 0 && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Stock de insumos insuficiente entre las reparaciones de la orden
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {insumosStockValidation.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. REPUESTOS ENTRANTES */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Repuestos Entrantes</h2>
              <button
                type="button"
                onClick={handleAgregarFila}
                className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
                title="Agregar otro repuesto entrante"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Input y Botón Aplicar a Todos */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Serial a aplicar a todos..."
                value={bulkSerialOrden}
                onChange={(e) => setBulkSerialOrden(e.target.value)}
                className="w-48 px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={handleApplySerialToAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                title="Aplica este serial a todas las piezas entrantes"
              >
                <Copy className="w-3.5 h-3.5" />
                Aplicar a todos
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {repuestosEntrantes.map((fila, index) => {
              const itemSeleccionado = fila.id_inventario
                ? inventarioMap.get(fila.id_inventario)
                : null;

              return (
                <div
                  key={fila.id}
                  className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* id_inventario con SearchableSelect inteligente + botón nuevo ítem */}
                    <div className="sm:col-span-5 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Modelo / Equipo Usado <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickItemTargetIndex(index);
                            setIsQuickItemOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Nuevo Ítem
                        </button>
                      </div>
                      <SearchableSelect
                        options={inventarioPermitido.map((item) => ({
                          value: item.id_inventario,
                          label: item.nombre,
                          sublabel: `${item.tipo.toUpperCase()} | Usado | SKU: ${item.sku || 'S/N'}`,
                          searchTerms: `${item.sku || ''} ${item.nombre} ${item.tipo}`,
                        }))}
                        value={fila.id_inventario}
                        onChange={(val) =>
                          handleSeleccionarItem(index, val ? Number(val) : '')
                        }
                        placeholder="Seleccionar equipo o repuesto..."
                        searchPlaceholder="Buscar por nombre o SKU..."
                        required
                      />
                    </div>

                    {/* serial */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Serial <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: CLI-COMP-334488"
                        value={fila.serial}
                        onChange={(e) =>
                          handleActualizarCampo(index, 'serial', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* service_tag */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Service Tag (Único) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Compresor-old-gen"
                        value={fila.service_tag}
                        onChange={(e) =>
                          handleActualizarCampo(index, 'service_tag', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Botón Eliminar fila (X) */}
                    <div className="sm:col-span-1 flex justify-center pb-0.5">
                      {repuestosEntrantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoverFila(fila.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                          title="Eliminar este repuesto entrante"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Panel de Insumos, Servicios y Botón de Edición si el ítem está seleccionado */}
                  {itemSeleccionado && (
                    <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-accent/20 p-3 rounded-xl">
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-muted-foreground">Insumos:</span>
                          <span className="font-semibold text-foreground">
                            {fila.insumos.length} configurados
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-muted-foreground">Servicios:</span>
                          <span className="font-semibold text-foreground">
                            {fila.servicios.length} configurados
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-muted-foreground">Monto Reparación Base:</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            ${Number(fila.monto_base || 0).toLocaleString('es-CL', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingIndex(index)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-500" />
                        <span>Ver / Editar Insumos y Servicios</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. RESUMEN ECONÓMICO CALCULADO AL MOMENTO */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Resumen Económico Estimado de la Orden
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-accent/30 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Total Gravado
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                ${totalGravado.toLocaleString('es-CL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="p-3 bg-accent/30 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Total Exento
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                ${totalExento.toLocaleString('es-CL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="p-3 bg-accent/30 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                IVA (19%)
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                ${totalIva.toLocaleString('es-CL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                Total Orden
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                ${totalGeneral.toLocaleString('es-CL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 5. BOTÓN GENERAR (centrado según boceto) */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={
              createOrdenMutation.isPending ||
              repuestosEntrantes.length === 0 ||
              insumosStockValidation.length > 0
            }
            className="w-full sm:w-80 py-3 text-sm sm:text-base font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createOrdenMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando Orden...</span>
              </>
            ) : (
              'Generar Orden'
            )}
          </button>
        </div>
      </form>

      {/* Modal de Creación Rápida de Cliente */}
      <QuickCreateClienteModal
        isOpen={isQuickClienteOpen}
        onClose={() => setIsQuickClienteOpen(false)}
        onCreated={(nuevoCli) => setIdCliente(nuevoCli.id_cliente)}
      />

      {/* Modal de Creación Rápida de Ítem (compresor/valvula usado) */}
      <QuickCreateItemModal
        isOpen={isQuickItemOpen}
        onClose={() => {
          setIsQuickItemOpen(false);
          setQuickItemTargetIndex(null);
        }}
        defaultTipo="compresor"
        defaultCondicion="usado"
        onCreated={(nuevoItem) => {
          if (quickItemTargetIndex !== null) {
            handleSeleccionarItem(quickItemTargetIndex, nuevoItem.id_inventario);
          }
          setIsQuickItemOpen(false);
          setQuickItemTargetIndex(null);
        }}
      />

      {/* Modal para Ver / Editar Insumos y Servicios de una Reparación */}
      {filaEnEdicion && editingIndex !== null && (
        <EditarReparacionModal
          isOpen={editingIndex !== null}
          onClose={() => setEditingIndex(null)}
          nombreItem={itemEnEdicion?.nombre || 'Ítem de Reparación'}
          serviceTag={filaEnEdicion.service_tag}
          initialInsumos={filaEnEdicion.insumos}
          initialServicios={filaEnEdicion.servicios}
          catalogoInsumos={catalogoInsumos}
          catalogoServicios={serviciosTaller}
          onSave={handleSaveModalReparacion}
        />
      )}
    </div>
  );
};

export default OrdenReparacionFormPage;
