import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  XCircle,
  Loader2,
  FileText
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { createCotizacionAction } from '@/admin/actions/create-cotizacion.action';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';

// Estructura de cada fila de venta en la tabla
export interface LineaVentaFila {
  id_inventario: number;
  tipo: 'compresor' | 'valvula' | 'insumo';
  sku: string;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  monto_total_linea: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number;
  monto_total_linea_con_ganancia: number;
  porcentaje_iva: number;
  monto_iva: number;
}

export const CotizacionInicialVentaFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Inventario (filtrado: solo compresor, valvula o insumo)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Tipos de Órdenes (para resolver id_tipo_orden correspondiente a 'venta')
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // Estado del cliente seleccionado
  const [idCliente, setIdCliente] = useState<number | ''>('');

  // Filas de venta seleccionadas
  const [lineasVenta, setLineasVenta] = useState<LineaVentaFila[]>([]);

  // Búsqueda en sidebar por SKU o nombre
  const [busquedaSku, setBusquedaSku] = useState('');

  // Catálogo disponible: solo compresor, valvula o insumo
  const inventarioPermitido = useMemo(() => {
    return inventario.filter((item) => {
      const t = item.tipo;
      return t === 'compresor' || t === 'valvula' || t === 'insumo';
    });
  }, [inventario]);

  // Mapa rápido de inventario por id
  const inventarioMap = useMemo(() => {
    return new Map<number, InventarioItem>(inventarioPermitido.map((i) => [i.id_inventario, i]));
  }, [inventarioPermitido]);

  // Ítems filtrados en el sidebar según la búsqueda
  const itemsFiltradosSidebar = useMemo(() => {
    if (!busquedaSku.trim()) return inventarioPermitido;
    const q = busquedaSku.toLowerCase().trim();
    return inventarioPermitido.filter(
      (item) =>
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.nombre.toLowerCase().includes(q)
    );
  }, [inventarioPermitido, busquedaSku]);

  // Resolución del id_tipo_orden de 'venta'
  const idTipoOrdenVenta = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'venta');
    return tipo ? tipo.id_tipo_orden : 1; // Fallback al id 1 si coincide
  }, [tiposOrdenes]);

  // ==========================================
  // CÁLCULOS MATEMÁTICOS DE LÍNEAS
  // ==========================================
  const calcularCostoUnitarioBase = (itemInv: InventarioItem): number => {
    const compraProm = Number(itemInv.monto_compra_prom || itemInv.ultimo_monto_compra || 0);
    const esUsado = (itemInv.condicion || '').toLowerCase().trim() === 'usado';

    if (esUsado) {
      const reparacionProm = Number(itemInv.monto_reparacion_prom || 0);
      return Number((compraProm + reparacionProm).toFixed(2));
    }

    return Number(compraProm.toFixed(2));
  };

  const calcularValoresLinea = (
    itemInv: InventarioItem,
    cantidad: number,
    costoUnitarioInput?: number,
    porcentajeGananciaInput?: number,
    costoConGananciaInput?: number
  ) => {
    const costoUnit =
      costoUnitarioInput !== undefined
        ? costoUnitarioInput
        : calcularCostoUnitarioBase(itemInv);

    let pctGan =
      porcentajeGananciaInput !== undefined
        ? porcentajeGananciaInput
        : Number(itemInv.porcentaje_ganancia || 0);

    let costoConGan = 0;

    if (costoConGananciaInput !== undefined) {
      costoConGan = costoConGananciaInput;
      if (costoConGan > 0 && costoUnit > 0) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      } else {
        pctGan = 0;
      }
    } else {
      costoConGan =
        pctGan > 0 && pctGan < 100
          ? Number((costoUnit / (1 - pctGan / 100)).toFixed(2))
          : costoUnit;
    }

    const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
    const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
    const pctIva = Number(itemInv.porcentaje_iva !== undefined ? itemInv.porcentaje_iva : 19);
    const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

    return {
      costo_unitario: costoUnit,
      monto_total_linea: montoTotalLinea,
      porcentaje_ganancia: pctGan,
      costo_unitario_con_ganancia: costoConGan,
      monto_total_linea_con_ganancia: montoTotalLineaConGan,
      porcentaje_iva: pctIva,
      monto_iva: montoIva,
    };
  };

  // Agregar ítem a las líneas de venta
  const handleAgregarItem = (itemInv: InventarioItem) => {
    const yaExiste = lineasVenta.some((l) => l.id_inventario === itemInv.id_inventario);
    if (yaExiste) {
      toast.info('Este ítem ya se encuentra agregado en la lista');
      return;
    }

    const calculos = calcularValoresLinea(itemInv, 1);
    const nuevaFila: LineaVentaFila = {
      id_inventario: itemInv.id_inventario,
      tipo: itemInv.tipo as 'compresor' | 'valvula' | 'insumo',
      sku: itemInv.sku || 'N/A',
      nombre: itemInv.nombre,
      cantidad: 1,
      ...calculos,
    };

    setLineasVenta((prev) => [...prev, nuevaFila]);
  };

  // Modificar cantidad, porcentaje de ganancia o costo unitario con ganancia
  const handleActualizarLinea = (
    index: number,
    campo: 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia',
    valor: number
  ) => {
    setLineasVenta((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const itemInv = inventarioMap.get(target.id_inventario);
      if (!itemInv) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, valor) : target.cantidad;
      const nuevoPctGan = campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, valor)) : undefined;
      const nuevoCostoConGan = campo === 'costo_unitario_con_ganancia' ? Math.max(0, valor) : undefined;

      const nuevosCalculos = calcularValoresLinea(
        itemInv,
        nuevaCantidad,
        target.costo_unitario, // costo_unitario se mantiene fijo
        nuevoPctGan !== undefined ? nuevoPctGan : (campo === 'costo_unitario_con_ganancia' ? undefined : target.porcentaje_ganancia),
        nuevoCostoConGan
      );

      actual[index] = {
        ...target,
        cantidad: nuevaCantidad,
        ...nuevosCalculos,
      };
      return actual;
    });
  };

  // Remover ítem de la lista
  const handleRemoverLinea = (index: number) => {
    setLineasVenta((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // TOTALES ECONÓMICOS DE LA COTIZACIÓN
  // ==========================================
  const totales = useMemo(() => {
    let gravado = 0;
    let exento = 0;
    let iva = 0;

    for (const l of lineasVenta) {
      if (l.porcentaje_iva > 0) {
        gravado += l.monto_total_linea_con_ganancia;
        iva += l.monto_iva;
      } else {
        exento += l.monto_total_linea_con_ganancia;
      }
    }

    const total = gravado + exento + iva;

    return {
      gravado: Number(gravado.toFixed(2)),
      exento: Number(exento.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [lineasVenta]);

  // Mutación para crear la cotización
  const createMutation = useMutation({
    mutationFn: createCotizacionAction,
    onSuccess: (cotCreada) => {
      toast.success(
        `Cotización ${cotCreada?.num_cotizacion ? '#' + cotCreada.num_cotizacion : ''} creada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      navigate('/admin/cotizaciones/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la cotización de venta';
      toast.error(msg);
    },
  });

  // Manejo del envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente) {
      toast.warning('Debe seleccionar un cliente para la cotización');
      return;
    }

    if (lineasVenta.length === 0) {
      toast.warning('Debe agregar al menos una línea de venta a la cotización');
      return;
    }

    // Estructuración del payload según la especificación exacta:
    // Si el tipo es 'insumo', se envía como id_inventario_insumo_saliente
    // Si el tipo es 'compresor' o 'valvula', se envía como id_inventario_repuesto_saliente
    const detalles_inventario = lineasVenta.map((l) => {
      const esInsumo = l.tipo === 'insumo';

      return {
        ...(esInsumo
          ? { id_inventario_insumo_saliente: l.id_inventario }
          : { id_inventario_repuesto_saliente: l.id_inventario }),
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.costo_unitario_con_ganancia),
        porcentaje_iva: Number(l.porcentaje_iva),
      };
    });

    const payload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenVenta),
      detalles_inventario,
    };

    createMutation.mutate(payload);
  };

  const isLoadingGlobal = isLoadingClientes || isLoadingInventario || isLoadingTiposOrdenes;

  if (isLoadingGlobal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando catálogo e información necesaria...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-7xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-500" />
            Registrar Nueva Cotización de Venta
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cotización inicial para venta directa de compresores, válvulas o insumos
          </p>
        </div>

        <Link
          to="/admin/cotizaciones/new/inicial"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. SELECTOR DE CLIENTE (boceto) */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2 max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Seleccione al Cliente <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={idCliente}
            onChange={(e) => setIdCliente(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          >
            <option value="">-- Seleccione al Cliente --</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre} {c.rut ? `(${c.rut})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. LÍNEAS DE VENTA Y SIDEBAR DE BÚSQUEDA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Líneas de Venta
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {lineasVenta.length} {lineasVenta.length === 1 ? 'ítem agregado' : 'ítems agregados'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Tabla de Líneas de Venta */}
            <div className="lg:col-span-9 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3 text-center">sku</th>
                      <th className="py-2.5 px-3 text-center">nombre</th>
                      <th className="py-2.5 px-3 text-center">cantidad</th>
                      <th className="py-2.5 px-3 text-center">costo unitario</th>
                      <th className="py-2.5 px-3 text-center">monto total linea</th>
                      <th className="py-2.5 px-3 text-center">porcentaje de ganancia</th>
                      <th className="py-2.5 px-3 text-center">costo unitario con ganancia</th>
                      <th className="py-2.5 px-3 text-center">monto total linea con ganancia</th>
                      <th className="py-2.5 px-3 text-center">porcentaje de iva</th>
                      <th className="py-2.5 px-3 text-center">monto de iva</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {lineasVenta.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-muted-foreground text-xs">
                          No hay líneas de venta agregadas. Selecciona ítems desde el panel lateral.
                        </td>
                      </tr>
                    ) : (
                      lineasVenta.map((linea, idx) => (
                        <tr key={idx} className="hover:bg-accent/40 transition-colors text-center">
                          {/* sku */}
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs whitespace-nowrap">
                            {linea.sku}
                          </td>

                          {/* nombre */}
                          <td className="py-2.5 px-3 font-medium text-foreground text-xs max-w-[180px] truncate" title={linea.nombre}>
                            {linea.nombre}
                          </td>

                          {/* cantidad */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={linea.cantidad}
                              onChange={(e) =>
                                handleActualizarLinea(idx, 'cantidad', Number(e.target.value))
                              }
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* costo unitario (no editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(linea.costo_unitario).toFixed(2)}
                          </td>

                          {/* monto total linea */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(linea.monto_total_linea).toFixed(2)}
                          </td>

                          {/* porcentaje de ganancia (editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            <div className="inline-flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                max={99.99}
                                step="any"
                                value={linea.porcentaje_ganancia}
                                onChange={(e) =>
                                  handleActualizarLinea(idx, 'porcentaje_ganancia', Number(e.target.value))
                                }
                                className="w-16 px-1.5 py-1 text-xs text-right rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-muted-foreground text-xs">%</span>
                            </div>
                          </td>

                          {/* costo unitario con ganancia (editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            <div className="inline-flex items-center gap-1 justify-center">
                              <span className="text-muted-foreground text-xs">$</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={linea.costo_unitario_con_ganancia}
                                onChange={(e) =>
                                  handleActualizarLinea(
                                    idx,
                                    'costo_unitario_con_ganancia',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>

                          {/* monto total linea con ganancia */}
                          <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                            ${Number(linea.monto_total_linea_con_ganancia).toFixed(2)}
                          </td>

                          {/* porcentaje de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {Number(linea.porcentaje_iva).toFixed(1)}%
                          </td>

                          {/* monto de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(linea.monto_iva).toFixed(2)}
                          </td>

                          {/* acción remover */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverLinea(idx)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remover línea"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar lateral: Buscar por SKU (solo compresor, valvula o insumo) */}
            <div className="lg:col-span-3 bg-card rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground block">Buscar por SKU</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaSku}
                    onChange={(e) => setBusquedaSku(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const disponible = itemsFiltradosSidebar.find(
                          (item) => !lineasVenta.some((l) => l.id_inventario === item.id_inventario)
                        );
                        if (disponible) {
                          handleAgregarItem(disponible);
                        } else if (itemsFiltradosSidebar.length > 0) {
                          toast.info('Los ítems encontrados ya están agregados');
                        }
                      }
                    }}
                    placeholder="Filtrar por SKU o nombre..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Solo ítems de tipo compresor, válvula o insumo
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {itemsFiltradosSidebar.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No se encontraron ítems
                  </p>
                ) : (
                  itemsFiltradosSidebar.slice(0, 20).map((item) => {
                    const yaSeleccionado = lineasVenta.some(
                      (l) => l.id_inventario === item.id_inventario
                    );

                    return (
                      <div
                        key={item.id_inventario}
                        className="pt-1.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span
                            className={`font-semibold block truncate ${yaSeleccionado
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                              }`}
                          >
                            {item.nombre}
                          </span>
                          {/* colocar propieda que cuando el mouse este encima muestre todo el texto del div */}
                          <div
                            className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono tooltip"
                            title={`SKU: ${item.sku || 'N/A'} | Tipo: ${item.tipo || 'N/A'} | Condición: ${item.condicion || 'N/A'} | Stock: ${item.cantidad_propia || 'N/A'}`}
                          >
                            <span>SKU: {item.sku || 'N/A'}</span>
                            <span>•</span>
                            <span>Tipo: {item.tipo}</span>
                            <span>•</span>
                            <span>Condición: {item.condicion}</span>
                            <span>•</span>
                            <span>Stock: {item.cantidad_propia}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAgregarItem(item)}
                          disabled={yaSeleccionado}
                          className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            }`}
                          title={yaSeleccionado ? 'Ya agregado' : 'Agregar a la cotización'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. TOTALES ECONÓMICOS DE LA COTIZACIÓN (boceto) */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground text-center border-b border-border/60 pb-2">
            Totales Económicos de la Cotización
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
            disabled={createMutation.isPending || lineasVenta.length === 0}
            className="w-full sm:w-80 py-3 text-sm sm:text-base font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando Cotización...
              </>
            ) : (
              'Generar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CotizacionInicialVentaFormPage;
