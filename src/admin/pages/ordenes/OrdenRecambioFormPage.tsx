import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { getRepuestosAction } from '@/admin/actions/get-repuestos.action';
import {
  createOrdenAction,
  type CreateOrdenRecambioPayload,
} from '@/admin/actions/create-orden.action';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';
import type { RepuestoItem } from '@/admin/interfaces/repuesto.interface';

// Cada bloque/línea de recambio según el boceto:
// Fila superior: id_inventario_repuesto_saliente | precio_unitario | porcentaje_iva (read only) | id_repuesto_saliente
// Fila inferior: id_inventario_repuesto_entrante | monto_tasacion | serial_entrante | service_tag
export interface LineaRecambioItem {
  id: string; // id temporal único
  id_inventario_repuesto_saliente: number | '';
  id_repuesto_saliente: number | '';
  precio_unitario: number | '';
  monto_tasacion: number | '';
  porcentaje_iva: number;
  id_inventario_repuesto_entrante: number | '';
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

  // Catálogo permitido para recambio: solo 'compresor' o 'valvula'
  const inventarioPermitido = useMemo(() => {
    return inventario.filter((item) => {
      const t = item.tipo;
      return t === 'compresor' || t === 'valvula';
    });
  }, [inventario]);

  // Mapa rápido de inventario por id_inventario
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

  // Líneas de recambio inicializadas con 1 bloque por defecto
  const [lineasRecambio, setLineasRecambio] = useState<LineaRecambioItem[]>([
    {
      id: crypto.randomUUID(),
      id_inventario_repuesto_saliente: '',
      id_repuesto_saliente: '',
      precio_unitario: '',
      monto_tasacion: '',
      porcentaje_iva: 19,
      id_inventario_repuesto_entrante: '',
      serial_entrante: '',
      service_tag: '',
    },
  ]);

  // Resolución del id_tipo_orden de 'recambio' (3)
  const idTipoOrdenRecambio = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'recambio');
    return tipo ? tipo.id_tipo_orden : 3;
  }, [tiposOrdenes]);

  // Conjunto de IDs de repuestos físicos seleccionados actualmente para evitar duplicados
  const repuestosSalientesSeleccionados = useMemo(() => {
    const set = new Set<number>();
    lineasRecambio.forEach((l) => {
      if (l.id_repuesto_saliente) {
        set.add(Number(l.id_repuesto_saliente));
      }
    });
    return set;
  }, [lineasRecambio]);

  // Agregar una nueva línea de recambio (+)
  const handleAgregarLinea = () => {
    setLineasRecambio((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        id_inventario_repuesto_saliente: '',
        id_repuesto_saliente: '',
        precio_unitario: '',
        monto_tasacion: '',
        porcentaje_iva: 19,
        id_inventario_repuesto_entrante: '',
        serial_entrante: '',
        service_tag: '',
      },
    ]);
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

      if (campo === 'id_inventario_repuesto_saliente') {
        const idSaliente = valor ? Number(valor) : '';
        linea.id_inventario_repuesto_saliente = idSaliente;
        // Al cambiar de ítem saliente, se resetea la pieza física seleccionada
        linea.id_repuesto_saliente = '';

        if (idSaliente) {
          const itemInv = inventarioMap.get(idSaliente);
          linea.porcentaje_iva =
            itemInv?.porcentaje_iva !== undefined && itemInv.porcentaje_iva !== null
              ? Number(itemInv.porcentaje_iva)
              : 19;

          // Precargar precio unitario sugerido
          if (itemInv?.monto_venta_unitario) {
            linea.precio_unitario = Number(itemInv.monto_venta_unitario);
          }
        }
      } else if (campo === 'id_repuesto_saliente') {
        linea.id_repuesto_saliente = valor ? Number(valor) : '';
      } else if (campo === 'id_inventario_repuesto_entrante') {
        linea.id_inventario_repuesto_entrante = valor ? Number(valor) : '';
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
    for (let i = 0; i < lineasRecambio.length; i++) {
      const l = lineasRecambio[i];
      const numFila = i + 1;

      if (!l.id_inventario_repuesto_saliente) {
        toast.warning(`En la línea #${numFila}, debe seleccionar el repuesto saliente`);
        return;
      }

      if (!l.id_repuesto_saliente) {
        toast.warning(
          `En la línea #${numFila}, debe seleccionar la pieza física en bodega (id_repuesto_saliente)`
        );
        return;
      }

      if (l.precio_unitario === '' || Number(l.precio_unitario) <= 0) {
        toast.warning(`En la línea #${numFila}, debe ingresar un precio unitario mayor a 0`);
        return;
      }

      if (!l.id_inventario_repuesto_entrante) {
        toast.warning(`En la línea #${numFila}, debe seleccionar el repuesto entrante`);
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

    // 2. REGLA CLAVE DEL BOCETO:
    // "validar antes de enviar en el payload, que no pueden haber service_tag iguales"
    const serviceTags = lineasRecambio.map((l) => l.service_tag.trim().toLowerCase());
    const serviceTagsSet = new Set(serviceTags);
    if (serviceTagsSet.size !== serviceTags.length) {
      toast.error('No pueden haber service_tag iguales entre las líneas de recambio.');
      return;
    }

    // 3. Validar que no haya repuestos físicos salientes repetidos
    const repsSalientes = lineasRecambio.map((l) => Number(l.id_repuesto_saliente));
    const repsSalientesSet = new Set(repsSalientes);
    if (repsSalientesSet.size !== repsSalientes.length) {
      toast.error('No puedes seleccionar la misma pieza física en bodega para más de una línea.');
      return;
    }

    // 4. Construcción del Payload exacto
    const payload: CreateOrdenRecambioPayload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenRecambio),
      detalles: lineasRecambio.map((l) => ({
        id_inventario_repuesto_saliente: Number(l.id_inventario_repuesto_saliente),
        id_repuesto_saliente: Number(l.id_repuesto_saliente),
        precio_unitario: Number(l.precio_unitario),
        monto_tasacion: Number(l.monto_tasacion),
        porcentaje_iva: Number(l.porcentaje_iva),
        id_inventario_repuesto_entrante: Number(l.id_inventario_repuesto_entrante),
        serial_entrante: l.serial_entrante.trim(),
        service_tag: l.service_tag.trim(),
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
            <option value="">Seleccione al Cliente</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre} {c.rut ? `(${c.rut})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. LÍNEAS DE RECAMBIO (Según boceto: bloque con botón + al lado) */}
        <div className="space-y-4">
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

          <div className="space-y-4">
            {lineasRecambio.map((linea, index) => {
              const repuestosDisponibles = linea.id_inventario_repuesto_saliente
                ? repuestosDisponiblesPorInventario.get(Number(linea.id_inventario_repuesto_saliente)) || []
                : [];

              const tasacionInvalida =
                linea.monto_tasacion !== '' &&
                linea.precio_unitario !== '' &&
                Number(linea.monto_tasacion) > Number(linea.precio_unitario);

              return (
                <div
                  key={linea.id}
                  className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs relative space-y-4"
                >
                  {/* Fila Superior: id_inventario_repuesto_saliente | precio_unitario | porcentaje_iva (read only) | id_repuesto_saliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* id_inventario_repuesto_saliente */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Repuesto Saliente (Catálogo) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={linea.id_inventario_repuesto_saliente}
                        onChange={(e) =>
                          handleActualizarCampo(
                            index,
                            'id_inventario_repuesto_saliente',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="">-- Seleccionar repuesto saliente --</option>
                        {inventarioPermitido.map((item) => (
                          <option key={item.id_inventario} value={item.id_inventario}>
                            {item.nombre} ({item.tipo} - {item.condicion || 'N/A'}) - Stock: {item.cantidad_propia}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* precio_unitario */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Precio Unitario <span className="text-rose-500">*</span>
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

                    {/* porcentaje_iva (read only según boceto) */}
                    <div className="sm:col-span-2 space-y-1">
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

                    {/* id_repuesto_saliente (pieza física en bodega) */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Repuesto Físico en Bodega (Saliente) <span className="text-rose-500">*</span>
                      </label>
                      {!linea.id_inventario_repuesto_saliente ? (
                        <div className="px-3 py-2 text-xs rounded-xl bg-muted/40 text-muted-foreground border border-border/60">
                          Selecciona el ítem saliente primero
                        </div>
                      ) : repuestosDisponibles.length === 0 ? (
                        <div className="px-3 py-1.5 text-xs rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Sin piezas físicas disponibles en bodega</span>
                        </div>
                      ) : (
                        <select
                          required
                          value={linea.id_repuesto_saliente}
                          onChange={(e) =>
                            handleActualizarCampo(
                              index,
                              'id_repuesto_saliente',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        >
                          <option value="">-- Seleccionar pieza física --</option>
                          {repuestosDisponibles.map((r) => {
                            const asignadoEnOtro =
                              repuestosSalientesSeleccionados.has(r.id_repuesto) &&
                              linea.id_repuesto_saliente !== r.id_repuesto;

                            return (
                              <option
                                key={r.id_repuesto}
                                value={r.id_repuesto}
                                disabled={asignadoEnOtro}
                              >
                                ID #{r.id_repuesto} | {r.estado} | Serial: {r.serial || 'Sin serial'} | Tag:{' '}
                                {r.service_tag || 'Sin tag'}{' '}
                                {asignadoEnOtro ? '(Seleccionado)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Fila Inferior: id_inventario_repuesto_entrante | monto_tasacion | serial_entrante | service_tag | Botón Eliminar (X) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                    {/* id_inventario_repuesto_entrante */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Repuesto Entrante (Cliente Averiado) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={linea.id_inventario_repuesto_entrante}
                        onChange={(e) =>
                          handleActualizarCampo(
                            index,
                            'id_inventario_repuesto_entrante',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="">-- Seleccionar repuesto entrante --</option>
                        {inventarioPermitido.map((item) => (
                          <option key={item.id_inventario} value={item.id_inventario}>
                            {item.nombre} ({item.tipo} - {item.condicion || 'usado'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* monto_tasacion */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Monto Tasación <span className="text-rose-500">*</span>
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

                    {/* serial_entrante */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Serial Entrante <span className="text-rose-500">*</span>
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
                    <div className="sm:col-span-3 space-y-1">
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

                    {/* Botón Eliminar fila (X) */}
                    <div className="sm:col-span-1 flex justify-center pb-0.5">
                      {lineasRecambio.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoverLinea(linea.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                          title="Eliminar esta línea de recambio"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
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
    </div>
  );
};

export default OrdenRecambioFormPage;
