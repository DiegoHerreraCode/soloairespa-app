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
  Info,
  AlertTriangle,
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { getRepuestosAction } from '@/admin/actions/get-repuestos.action';
import {
  createOrdenAction,
  type CreateOrdenVentaPayload,
} from '@/admin/actions/create-orden.action';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';
import type { RepuestoItem } from '@/admin/interfaces/repuesto.interface';

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

// Representa una unidad física individual para asignación en bodega
export interface UnidadFisicaVenta {
  unitKey: string; // `${id_inventario}_${subIndex}`
  id_inventario: number;
  subIndex: number; // 1 de 2, etc.
  cantidadTotal: number;
  nombre: string;
  sku: string;
  precioUnitarioConGanancia: number;
}

export const OrdenVentaFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Cargar Catálogo de Inventario
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Cargar Tipos de Órdenes
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // 4. Cargar Repuestos Físicos en Stock
  const { data: repuestos = [], isLoading: isLoadingRepuestos } = useQuery<RepuestoItem[]>({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
  });

  // Estado del cliente seleccionado
  const [idCliente, setIdCliente] = useState<number | ''>('');

  // Filas de venta en la tabla
  const [lineasVenta, setLineasVenta] = useState<LineaVentaFila[]>([]);

  // Búsqueda en sidebar por SKU o nombre
  const [busquedaSku, setBusquedaSku] = useState('');

  // Asignaciones de stock físico: { [unitKey]: id_repuesto }
  const [stockFisicoAsignado, setStockFisicoAsignado] = useState<Record<string, number>>({});

  // Catálogo permitido para venta: solo compresor, valvula o insumo
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

  // Repuestos disponibles en taller por id_inventario:
  // Regla: propietario === true && id_orden_salida === null/undefined
  const repuestosDisponiblesPorInventario = useMemo(() => {
    const map = new Map<number, RepuestoItem[]>();
    for (const r of repuestos) {
      if (r.propietario === true && (r.id_orden_salida === null || r.id_orden_salida === undefined)) {
        const list = map.get(r.id_inventario) || [];
        list.push(r);
        map.set(r.id_inventario, list);
      }
    }
    return map;
  }, [repuestos]);

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
    return tipo ? tipo.id_tipo_orden : 1;
  }, [tiposOrdenes]);

  // ==========================================
  // CÁLCULOS MATEMÁTICOS DE LÍNEAS
  // ==========================================
  // Regla del usuario:
  // - Si el item tiene condicion = 'usado': costo unitario = monto_compra_prom + monto_reparacion_prom
  // - Si el item tiene condicion = 'nuevo': costo unitario = monto_compra_prom
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
    const costoUnit = costoUnitarioInput ?? calcularCostoUnitarioBase(itemInv);
    const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));

    let pctGanancia = 45;
    let costoConGan = 0;

    if (costoConGananciaInput !== undefined) {
      costoConGan = Number(costoConGananciaInput.toFixed(2));
      pctGanancia =
        costoConGan > 0
          ? Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2))
          : 0;
    } else {
      pctGanancia =
        porcentajeGananciaInput !== undefined
          ? porcentajeGananciaInput
          : itemInv.porcentaje_ganancia !== undefined && itemInv.porcentaje_ganancia !== null
            ? Number(itemInv.porcentaje_ganancia)
            : 45;

      const factor = 1 - pctGanancia / 100;
      costoConGan = factor > 0 ? Number((costoUnit / factor).toFixed(2)) : costoUnit;
    }

    const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
    const pctIva =
      itemInv.porcentaje_iva !== undefined && itemInv.porcentaje_iva !== null
        ? Number(itemInv.porcentaje_iva)
        : 19;
    const montoIva = Number(((montoTotalLineaConGan * pctIva) / 100).toFixed(2));

    return {
      costo_unitario: costoUnit,
      monto_total_linea: montoTotalLinea,
      porcentaje_ganancia: pctGanancia,
      costo_unitario_con_ganancia: costoConGan,
      monto_total_linea_con_ganancia: montoTotalLineaConGan,
      porcentaje_iva: pctIva,
      monto_iva: montoIva,
    };
  };

  // Agregar ítem desde el sidebar
  const handleAgregarItem = (itemInv: InventarioItem) => {
    const yaExiste = lineasVenta.some((l) => l.id_inventario === itemInv.id_inventario);
    if (yaExiste) {
      toast.info(`El ítem "${itemInv.nombre}" ya está en las líneas de venta`);
      return;
    }

    const cantidadInicial = 1;
    const calculos = calcularValoresLinea(itemInv, cantidadInicial);

    const nuevaLinea: LineaVentaFila = {
      id_inventario: itemInv.id_inventario,
      tipo: itemInv.tipo as 'compresor' | 'valvula' | 'insumo',
      sku: itemInv.sku || 'SIN-SKU',
      nombre: itemInv.nombre,
      cantidad: cantidadInicial,
      ...calculos,
    };

    setLineasVenta((prev) => [...prev, nuevaLinea]);
  };

  // Modificar cantidad, porcentaje_ganancia o costo_unitario_con_ganancia
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
        target.costo_unitario,
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

  // Remover ítem de la tabla
  const handleRemoverLinea = (index: number) => {
    const itemEliminado = lineasVenta[index];
    setLineasVenta((prev) => prev.filter((_, i) => i !== index));

    // Limpiar posibles asignaciones de stock físico asociadas a este ítem
    if (itemEliminado && itemEliminado.tipo !== 'insumo') {
      setStockFisicoAsignado((prev) => {
        const nuevo = { ...prev };
        Object.keys(nuevo).forEach((k) => {
          if (k.startsWith(`${itemEliminado.id_inventario}_`)) {
            delete nuevo[k];
          }
        });
        return nuevo;
      });
    }
  };

  // ==========================================
  // UNIDADES FÍSICAS REQUERIDAS (Solo Repuestos Serializados)
  // ==========================================
  const unidadesFisicasRequeridas = useMemo<UnidadFisicaVenta[]>(() => {
    const unidades: UnidadFisicaVenta[] = [];
    lineasVenta.forEach((linea) => {
      if (linea.tipo !== 'insumo') {
        const cant = Math.max(1, Number(linea.cantidad) || 1);
        for (let sub = 1; sub <= cant; sub++) {
          unidades.push({
            unitKey: `${linea.id_inventario}_${sub}`,
            id_inventario: linea.id_inventario,
            subIndex: sub,
            cantidadTotal: cant,
            nombre: linea.nombre,
            sku: linea.sku,
            precioUnitarioConGanancia: Number(linea.costo_unitario_con_ganancia),
          });
        }
      }
    });
    return unidades;
  }, [lineasVenta]);

  // Conjunto de IDs de repuestos físicos ya seleccionados en alguna unidad (para no repetir el mismo en bodega)
  const repuestosSeleccionadosSet = useMemo(() => {
    const set = new Set<number>();
    Object.values(stockFisicoAsignado).forEach((idRep) => {
      if (idRep) set.add(idRep);
    });
    return set;
  }, [stockFisicoAsignado]);

  // ==========================================
  // TOTALES ECONÓMICOS DE LA ORDEN
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

  // Mutación para crear la Orden de Venta
  const createOrdenMutation = useMutation({
    mutationFn: (payload: CreateOrdenVentaPayload) => createOrdenAction(payload),
    onSuccess: (ordenCreada) => {
      toast.success(
        `Orden de Venta #${ordenCreada?.id_orden || ''} registrada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-catalogo'] });
      navigate('/admin/ordenes/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la orden de venta';
      toast.error(msg);
    },
  });

  // Manejo del envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente) {
      toast.warning('Debe seleccionar un cliente para la orden');
      return;
    }

    if (lineasVenta.length === 0) {
      toast.warning('Debe agregar al menos una línea de venta a la orden');
      return;
    }

    // Validar que todas las unidades de repuestos serializados tengan su pieza física asignada
    for (const u of unidadesFisicasRequeridas) {
      const idRepuestoAsignado = stockFisicoAsignado[u.unitKey];
      if (!idRepuestoAsignado) {
        toast.warning(
          `Debes seleccionar el repuesto físico en bodega para la unidad #${u.subIndex} de "${u.nombre}"`
        );
        return;
      }
    }

    // Validar que no haya repuestos físicos duplicados
    const idsFisicos = Object.values(stockFisicoAsignado);
    const idsFisicosUnicos = new Set(idsFisicos);
    if (idsFisicosUnicos.size !== idsFisicos.length) {
      toast.warning('No puedes asignar el mismo repuesto físico en bodega a más de una unidad.');
      return;
    }

    // Construcción del payload según la estructura exacta:
    // Caso A: Si es insumo:
    // {
    //   "id_inventario_insumo_saliente": 1,
    //   "cantidad": 1,
    //   "precio_unitario": 67636.36,
    //   "porcentaje_iva": 19.00
    // }
    // Caso B: Si es repuesto serializado:
    // {
    //   "id_inventario_repuesto_saliente": 2,
    //   "porcentaje_iva": 19.00,
    //   "repuestos_salientes": [
    //     { "id_repuesto": 14, "precio_unitario": 273363.1 }
    //   ]
    // }
    const detallesPayload: any[] = [];

    lineasVenta.forEach((l) => {
      if (l.tipo === 'insumo') {
        detallesPayload.push({
          id_inventario_insumo_saliente: l.id_inventario,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.costo_unitario_con_ganancia),
          porcentaje_iva: Number(l.porcentaje_iva),
        });
      } else {
        const cant = Math.max(1, Number(l.cantidad) || 1);
        const listaRepuestosSalientes = [];

        for (let sub = 1; sub <= cant; sub++) {
          const unitKey = `${l.id_inventario}_${sub}`;
          const idRep = stockFisicoAsignado[unitKey];
          listaRepuestosSalientes.push({
            id_repuesto: Number(idRep),
            precio_unitario: Number(l.costo_unitario_con_ganancia),
          });
        }

        detallesPayload.push({
          id_inventario_repuesto_saliente: l.id_inventario,
          porcentaje_iva: Number(l.porcentaje_iva),
          repuestos_salientes: listaRepuestosSalientes,
        });
      }
    });

    const payload: CreateOrdenVentaPayload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenVenta),
      detalles: detallesPayload,
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
          <p className="text-sm font-medium">Cargando formulario de orden de venta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-7xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Registrar Nueva Orden de Venta
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Generación directa de orden comercial y salida de stock físico para el cliente
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
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Seleccione al Cliente <span className="text-rose-500">*</span>
          </label>
          <select
            value={idCliente}
            onChange={(e) => setIdCliente(e.target.value ? Number(e.target.value) : '')}
            required
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium cursor-pointer"
          >
            <option value="">Seleccione al Cliente ∨</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre} {c.rut ? `(${c.rut})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. LÍNEAS DE VENTA (TABLA + SIDEBAR BUSCADOR POR SKU) */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Líneas de Venta</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Tabla de Líneas de Venta (9 columnas en lg) */}
            <div className="lg:col-span-9 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold text-[11px]">
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
                        <td colSpan={11} className="py-10 text-center text-muted-foreground text-xs">
                          No hay líneas de venta agregadas. Selecciona ítems desde el panel lateral derecho.
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
                          <td
                            className="py-2.5 px-3 font-medium text-foreground text-xs max-w-[170px] truncate"
                            title={linea.nombre}
                          >
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

                          {/* costo unitario */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(linea.costo_unitario).toFixed(2)}
                          </td>

                          {/* monto total linea */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(linea.monto_total_linea).toFixed(2)}
                          </td>

                          {/* porcentaje de ganancia */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            <div className="inline-flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                max={99.99}
                                step="any"
                                value={linea.porcentaje_ganancia}
                                onChange={(e) =>
                                  handleActualizarLinea(
                                    idx,
                                    'porcentaje_ganancia',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 px-1.5 py-1 text-xs text-right rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-muted-foreground text-xs">%</span>
                            </div>
                          </td>

                          {/* costo unitario con ganancia */}
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
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                            {Number(linea.porcentaje_iva).toFixed(1)}%
                          </td>

                          {/* monto de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(linea.monto_iva).toFixed(2)}
                          </td>

                          {/* Botón eliminar fila */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverLinea(idx)}
                              className="text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer"
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

            {/* Sidebar lateral: Buscar por SKU */}
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
                            className={`font-semibold block truncate ${yaSeleccionado ? 'text-muted-foreground line-through' : 'text-foreground'
                              }`}
                          >
                            {item.nombre}
                          </span>
                          <div
                            className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono"
                            title={`SKU: ${item.sku || 'N/A'} | Tipo: ${item.tipo || 'N/A'} | Condición: ${item.condicion || 'N/A'} | Stock: ${item.cantidad_propia || 'N/A'}`}
                          >
                            <span>SKU: {item.sku || 'N/A'}</span>
                            <span>•</span>
                            <span>Tipo: {item.tipo}</span>
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
                          title={yaSeleccionado ? 'Ya agregado' : 'Agregar a la orden'}
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

        {/* 4. ASIGNACIÓN DE STOCK FÍSICO EN BODEGA (Exacto al boceto) */}
        {unidadesFisicasRequeridas.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 text-dark-700 dark:text-dark-400">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold">Asignación de Stock Físico:</span> Por cada unidad física
                de repuesto serializado cotizado, selecciona el número de serie de bodega que se
                entregará al cliente.
              </div>
            </div>

            <div className="space-y-4">
              {unidadesFisicasRequeridas.map((unidad, idx) => {
                const repuestosDisponibles =
                  repuestosDisponiblesPorInventario.get(unidad.id_inventario) || [];
                const valorActual = stockFisicoAsignado[unidad.unitKey] || '';
                const esMultiple = unidad.cantidadTotal > 1;

                return (
                  <div
                    key={unidad.unitKey}
                    className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground">{unidad.nombre}</span>
                        {esMultiple && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Unidad {unidad.subIndex} de {unidad.cantidadTotal}
                          </span>
                        )}
                        {unidad.sku && (
                          <span className="text-xs font-mono text-muted-foreground bg-accent px-2 py-0.5 rounded">
                            {unidad.sku}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        Línea de Venta
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Seleccionar Repuesto Físico en Bodega (Serial y Service Tag){' '}
                        <span className="text-rose-500">*</span>
                      </label>

                      {repuestosDisponibles.length === 0 ? (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          No hay unidades físicas disponibles en taller para este modelo (propiedad de la empresa, sin orden de salida).
                        </div>
                      ) : (
                        <select
                          required
                          value={valorActual}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setStockFisicoAsignado((prev) => ({
                              ...prev,
                              [unidad.unitKey]: val,
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        >
                          <option value="">-- Seleccionar pieza física en bodega --</option>
                          {repuestosDisponibles.map((r) => {
                            // Si ya fue asignado en otra unidad diferente a esta
                            const asignadoEnOtro =
                              repuestosSeleccionadosSet.has(r.id_repuesto) &&
                              valorActual !== r.id_repuesto;

                            return (
                              <option
                                key={r.id_repuesto}
                                value={r.id_repuesto}
                                disabled={asignadoEnOtro}
                              >
                                ID #{r.id_repuesto} | Serial: {r.serial || 'Sin serial'} | Tag:{' '}
                                {r.service_tag || 'Sin tag'} ({r.estado}){' '}
                                {asignadoEnOtro ? '(Ya seleccionado)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. TOTALES ECONÓMICOS DE LA ORDEN (boceto) */}
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

        {/* 6. BOTÓN GENERAR (centrado según boceto) */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={createOrdenMutation.isPending || lineasVenta.length === 0}
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
    </div>
  );
};

export default OrdenVentaFormPage;
