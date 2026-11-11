import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Copy,
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { getRepuestosAction } from '@/admin/actions/get-repuestos.action';
import {
  createOrdenAction,
  type CreateOrdenRecambioPayload,
} from '@/admin/actions/create-orden.action';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateClienteModal } from '@/admin/components/clientes/QuickCreateClienteModal';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';
import type { RepuestoItem } from '@/admin/interfaces/repuesto.interface';
import { generarServiceTagUnico } from '@/admin/utils/service-tag-generator';

// Cada bloque/línea de recambio:
// El ítem que sale y entra es el mismo (mismo id_inventario).
// El sistema selecciona automáticamente la pieza física 'reparado' de la bodega (FIFO por id_repuesto).
export interface LineaRecambioItem {
  id: string; // id temporal único
  id_inventario: number | '';
  precio_unitario: number | '';
  monto_tasacion: number | '';
  porcentaje_iva: number;
  serial_entrante: string;
  service_tag: string;
}

export const OrdenRecambioFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Inventario (filtrado: solo compresores y válvulas)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Tipos de Órdenes (para resolver id_tipo_orden de 'recambio')
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // 4. Repuestos físicos en stock (para id_repuesto_saliente)
  const { data: repuestos = [], isLoading: isLoadingRepuestos } = useQuery<RepuestoItem[]>({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
  });

  // Estado del cliente seleccionado
  const [idCliente, setIdCliente] = useState<number | ''>('');
  const [isQuickClienteOpen, setIsQuickClienteOpen] = useState(false);

  // Catálogo permitido para recambio: solo 'compresor' o 'valvula' en condicion 'usado'
  const inventarioPermitido = useMemo(() => {
    return inventario.filter((item) => {
      const t = item.tipo;
      return (t === 'compresor' || t === 'valvula') && item.condicion === 'usado';
    });
  }, [inventario]);

  // Mapa rápido de inventario por id_inventario
  const inventarioMap = useMemo(() => {
    return new Map<number, InventarioItem>(inventarioPermitido.map((i) => [i.id_inventario, i]));
  }, [inventarioPermitido]);

  // Repuestos reparados disponibles en taller para recambio por id_inventario:
  // Criterio solicitado: propietario === true, id_orden_salida === null, estado === 'reparado'
  const repuestosReparadosPorInventario = useMemo(() => {
    const map = new Map<number, RepuestoItem[]>();
    for (const r of repuestos) {
      if (
        r.propietario === true &&
        (r.id_orden_salida === null || r.id_orden_salida === undefined) &&
        r.estado === 'reparado'
      ) {
        const list = map.get(r.id_inventario) || [];
        list.push(r);
        map.set(r.id_inventario, list);
      }
    }
    return map;
  }, [repuestos]);

  // Función para obtener stock disponible para recambio (unidades reparadas en bodega)
  const getStockDisponibleRecambio = (idInv: number): number => {
    return (repuestosReparadosPorInventario.get(idInv) || []).length;
  };

  // Conjunto de service_tags existentes en base de datos
  const existingServiceTagsSet = useMemo(() => {
    const set = new Set<string>();
    repuestos.forEach((r) => {
      if (r.service_tag) set.add(r.service_tag.toLowerCase().trim());
    });
    return set;
  }, [repuestos]);

  // Obtener un conjunto combinado de service_tags actuales (BD + líneas)
  const getCombinedServiceTagsSet = () => {
    const set = new Set<string>(existingServiceTagsSet);
    lineasRecambio.forEach((l) => {
      if (l.service_tag) set.add(l.service_tag.toLowerCase().trim());
    });
    return set;
  };

  // Estado para el serial de "Aplicar a todos" en la orden de recambio
  const [bulkSerialRecambio, setBulkSerialRecambio] = useState<string>('');

  // Líneas de recambio inicializadas con 1 bloque por defecto
  const [lineasRecambio, setLineasRecambio] = useState<LineaRecambioItem[]>(() => {
    const defaultTag = generarServiceTagUnico('compresor');
    return [
      {
        id: crypto.randomUUID(),
        id_inventario: '',
        precio_unitario: '',
        monto_tasacion: '',
        porcentaje_iva: 19,
        serial_entrante: defaultTag,
        service_tag: defaultTag,
      },
    ];
  });

  // Resolución del id_tipo_orden de 'recambio' (3)
  const idTipoOrdenRecambio = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'recambio');
    return tipo ? tipo.id_tipo_orden : 3;
  }, [tiposOrdenes]);

  // Agregar una nueva línea de recambio (+)
  const handleAgregarLinea = () => {
    const currentTags = getCombinedServiceTagsSet();
    const defaultTag = generarServiceTagUnico('compresor', currentTags);
    setLineasRecambio((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        id_inventario: '',
        precio_unitario: '',
        monto_tasacion: '',
        porcentaje_iva: 19,
        serial_entrante: defaultTag,
        service_tag: defaultTag,
      },
    ]);
  };

  // Aplicar serial masivo a todas las líneas de recambio entrantes
  const handleApplySerialToAll = () => {
    const val = bulkSerialRecambio.trim();
    if (!val) {
      toast.warning('Ingresa un serial para aplicar a todas las piezas entrantes');
      return;
    }

    setLineasRecambio((prev) =>
      prev.map((l) => ({
        ...l,
        serial_entrante: val,
      }))
    );

    toast.success(`Serial "${val}" aplicado a todas las piezas entrantes`);
  };

  // Remover línea de recambio (X)
  const handleRemoverLinea = (id: string) => {
    if (lineasRecambio.length <= 1) {
      toast.warning('Debe existir al menos una línea de recambio');
      return;
    }
    setLineasRecambio((prev) => prev.filter((l) => l.id !== id));
  };

  // Actualizar campo de una línea
  const handleActualizarCampo = (
    index: number,
    campo: keyof LineaRecambioItem,
    valor: any
  ) => {
    setLineasRecambio((prev) => {
      const actual = [...prev];
      const linea = { ...actual[index] };

      if (campo === 'id_inventario') {
        const idInv = valor ? Number(valor) : '';
        linea.id_inventario = idInv;

        if (idInv) {
          const itemInv = inventarioMap.get(idInv);
          linea.porcentaje_iva =
            itemInv?.porcentaje_iva !== undefined && itemInv.porcentaje_iva !== null
              ? Number(itemInv.porcentaje_iva)
              : 19;

          // Precargar precio unitario sugerido
          if (itemInv?.monto_venta_unitario) {
            linea.precio_unitario = Number(itemInv.monto_venta_unitario);
          }
        }
      } else if (campo === 'precio_unitario' || campo === 'monto_tasacion') {
        linea[campo] = valor === '' ? '' : Math.max(0, Number(valor));
      } else {
        (linea as any)[campo] = valor;
      }

      actual[index] = linea;
      return actual;
    });
  };

  // ==========================================
  // TOTALES ECONÓMICOS DE LA ORDEN DE RECAMBIO
  // ==========================================
  // Monto neto gravado de cada línea = precio_unitario - monto_tasacion
  const totales = useMemo(() => {
    let gravado = 0;
    let exento = 0;
    let iva = 0;

    for (const l of lineasRecambio) {
      const pu = Number(l.precio_unitario) || 0;
      const tas = Number(l.monto_tasacion) || 0;
      const diferencia = Math.max(0, pu - tas);
      const pctIva = Number(l.porcentaje_iva) || 0;

      if (pctIva > 0) {
        gravado += diferencia;
        iva += (diferencia * pctIva) / 100;
      } else {
        exento += diferencia;
      }
    }

    const total = gravado + exento + iva;

    return {
      gravado: Number(gravado.toFixed(2)),
      exento: Number(exento.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [lineasRecambio]);

  // Mutación para crear la Orden de Recambio
  const createOrdenMutation = useMutation({
    mutationFn: (payload: CreateOrdenRecambioPayload) => createOrdenAction(payload),
    onSuccess: (ordenCreada) => {
      toast.success(
        `Orden de Recambio #${ordenCreada?.id_orden || ''} registrada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-catalogo'] });
      navigate('/admin/ordenes/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la orden de recambio';
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

    if (lineasRecambio.length === 0) {
      toast.warning('Debe agregar al menos una línea de recambio');
      return;
    }

    // 1. Validar que cada línea tenga todos los campos requeridos
    const conteoPorInventario = new Map<number, number>();

    for (let i = 0; i < lineasRecambio.length; i++) {
      const l = lineasRecambio[i];
      const numFila = i + 1;

      if (!l.id_inventario) {
        toast.warning(`En la línea #${numFila}, debe seleccionar el repuesto de recambio`);
        return;
      }

      const idInv = Number(l.id_inventario);
      const stockDisp = getStockDisponibleRecambio(idInv);
      const acumulado = (conteoPorInventario.get(idInv) || 0) + 1;
      conteoPorInventario.set(idInv, acumulado);

      if (acumulado > stockDisp) {
        const itemInv = inventarioMap.get(idInv);
        toast.warning(
          `No hay suficiente stock reparado disponible para "${itemInv?.nombre || 'el ítem'}". Disponibles: ${stockDisp}`
        );
        return;
      }

      if (l.precio_unitario === '' || Number(l.precio_unitario) <= 0) {
        toast.warning(`En la línea #${numFila}, debe ingresar un precio unitario mayor a 0`);
        return;
      }

      if (l.monto_tasacion === '' || Number(l.monto_tasacion) < 0) {
        toast.warning(`En la línea #${numFila}, debe ingresar el monto de tasación`);
        return;
      }

      if (Number(l.monto_tasacion) > Number(l.precio_unitario)) {
        toast.warning(
          `En la línea #${numFila}, el monto de tasación no puede superar el precio unitario`
        );
        return;
      }

      if (!l.serial_entrante.trim()) {
        toast.warning(
          `En la línea #${numFila}, debe ingresar el serial de la pieza entrante del cliente`
        );
        return;
      }

      if (!l.service_tag.trim()) {
        toast.warning(`En la línea #${numFila}, debe ingresar el service_tag para la pieza entrante`);
        return;
      }
    }

    // 2. REGLA CLAVE:
    // No pueden haber service_tag iguales entre las líneas
    const serviceTags = lineasRecambio.map((l) => l.service_tag.trim().toLowerCase());
    const serviceTagsSet = new Set(serviceTags);
    if (serviceTagsSet.size !== serviceTags.length) {
      toast.error('No pueden haber service_tag iguales entre las líneas de recambio.');
      return;
    }

    // 3. Construcción del Payload exacto (id_inventario_repuesto_saliente = id_inventario_repuesto_entrante)
    const payload: CreateOrdenRecambioPayload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenRecambio),
      detalles: lineasRecambio.map((l) => ({
        id_inventario_repuesto_saliente: Number(l.id_inventario),
        precio_unitario: Number(l.precio_unitario),
        monto_tasacion: Number(l.monto_tasacion),
        porcentaje_iva: Number(l.porcentaje_iva),
        id_inventario_repuesto_entrante: Number(l.id_inventario),
        serial_entrante: l.serial_entrante.trim(),
        service_tag: l.service_tag.trim(),
        service_tag_entrante: l.service_tag.trim(),
      })),
    };

    createOrdenMutation.mutate(payload);
  };

  const isLoadingGlobal =
    isLoadingClientes || isLoadingInventario || isLoadingTiposOrdenes || isLoadingRepuestos;

  if (isLoadingGlobal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Cargando formulario de orden de recambio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Registrar Nueva Orden de Recambio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Intercambio de pieza garantizada del taller por pieza averiada del cliente con tasación
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
        {/* 2. SELECTOR DE CLIENTE */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs max-w-lg space-y-2">
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

        {/* 3. LÍNEAS DE RECAMBIO (Según boceto: bloque con botón + al lado y Aplicar a Todos) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Líneas de Recambio</h2>
              <button
                type="button"
                onClick={handleAgregarLinea}
                className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
                title="Agregar otra línea de recambio"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Input y Botón Aplicar a Todos para seriales entrantes */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Serial a aplicar a todos..."
                value={bulkSerialRecambio}
                onChange={(e) => setBulkSerialRecambio(e.target.value)}
                className="w-48 px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={handleApplySerialToAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                title="Aplica este serial a todas las piezas entrantes de recambio"
              >
                <Copy className="w-3.5 h-3.5" />
                Aplicar a todos
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {lineasRecambio.map((linea, index) => {
              const stockDispRecambio = linea.id_inventario
                ? getStockDisponibleRecambio(Number(linea.id_inventario))
                : 0;

              const tasacionInvalida =
                linea.monto_tasacion !== '' &&
                linea.precio_unitario !== '' &&
                Number(linea.monto_tasacion) > Number(linea.precio_unitario);

              return (
                <div
                  key={linea.id}
                  className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs relative space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {index + 1}
                      </span>
                      Línea de Recambio
                    </span>

                    {lineasRecambio.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoverLinea(linea.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar esta línea"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fila 1: Selector Inteligente del Repuesto (Entra y Sale el mismo) + Stock disponible para recambio */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Selector SearchableSelect para id_inventario */}
                    <div className="sm:col-span-8 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Repuesto de Recambio (Sale reparado / Entra usado del cliente){' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={inventarioPermitido.map((item) => {
                          const disp = getStockDisponibleRecambio(item.id_inventario);
                          return {
                            value: item.id_inventario,
                            label: item.nombre,
                            sublabel: `SKU: ${item.sku || 'S/SKU'} • ${item.tipo} (${item.condicion || 'usado'}) • Disp. Recambio: ${disp}`,
                            searchTerms: `${item.sku || ''} ${item.tipo || ''}`,
                          };
                        })}
                        value={linea.id_inventario}
                        onChange={(val) =>
                          handleActualizarCampo(index, 'id_inventario', val)
                        }
                        placeholder="Buscar por nombre o SKU..."
                        searchPlaceholder="Buscar compresor o válvula usada..."
                        required
                      />
                    </div>

                    {/* Stock disponible para recambio */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Stock Disponible para Recambio
                      </label>
                      <div className="px-3 py-2 rounded-xl bg-accent/40 border border-border/80 text-xs font-mono font-bold flex items-center justify-between">
                        <span className="text-muted-foreground">Unidades reparadas:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${stockDispRecambio > 0
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                        >
                          {stockDispRecambio}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Condiciones Comerciales: Precio Unitario, Monto Tasación, % IVA */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* precio_unitario */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Precio Unitario (Venta de la pieza) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min={0}
                          step="any"
                          placeholder="0.00"
                          value={linea.precio_unitario}
                          onChange={(e) =>
                            handleActualizarCampo(index, 'precio_unitario', e.target.value)
                          }
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* monto_tasacion */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Monto Tasación (Valor de la pieza averiada) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min={0}
                          step="any"
                          placeholder="0.00"
                          value={linea.monto_tasacion}
                          onChange={(e) =>
                            handleActualizarCampo(index, 'monto_tasacion', e.target.value)
                          }
                          className={`w-full pl-6 pr-2.5 py-1.5 text-xs sm:text-sm rounded-xl bg-background border ${tasacionInvalida
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-border/80 focus:ring-blue-500'
                            } text-foreground font-mono focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                    </div>

                    {/* porcentaje_iva (read only) */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        % IVA (read only)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${Number(linea.porcentaje_iva).toFixed(1)}%`}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-muted/50 border border-border/60 text-muted-foreground font-mono cursor-not-allowed text-center select-none"
                      />
                    </div>
                  </div>

                  {/* Fila 3: Identificadores de la pieza que ingresa del cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* serial_entrante */}
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Serial Pieza Entrante (Cliente) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: SN-COMP-3457"
                        value={linea.serial_entrante}
                        onChange={(e) =>
                          handleActualizarCampo(index, 'serial_entrante', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* service_tag */}
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Service Tag (Único) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Compresor-Recambio"
                        value={linea.service_tag}
                        onChange={(e) =>
                          handleActualizarCampo(index, 'service_tag', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {tasacionInvalida && (
                    <p className="text-xs text-rose-500 font-medium">
                      El monto de tasación (${Number(linea.monto_tasacion).toLocaleString('es-CL')})
                      no puede ser superior al precio unitario ($
                      {Number(linea.precio_unitario).toLocaleString('es-CL')}).
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. TOTALES ECONÓMICOS DE LA ORDEN (boceto) */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground text-center border-b border-border/60 pb-2">
            Totales Económicos de la Orden
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-accent/40 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                Total Gravado
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                ${totales.gravado.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-accent/40 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                Total Exento
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                ${totales.exento.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-accent/40 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                Total IVA (19%)
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                ${totales.iva.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
              <span className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider block">
                Monto Total
              </span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
                ${totales.total.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* 5. BOTÓN GENERAR (centrado según boceto) */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={createOrdenMutation.isPending || lineasRecambio.length === 0}
            className="w-full sm:w-80 py-3 text-sm sm:text-base font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createOrdenMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando Orden...</span>
              </>
            ) : (
              'Generar'
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
    </div>
  );
};

export default OrdenRecambioFormPage;
