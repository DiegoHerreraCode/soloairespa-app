import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Wrench,
  RefreshCw,
  Info,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

import { getCotizacionByIdAction } from '@/admin/actions/get-cotizacion-by-id.action';
import { getRepuestosAction } from '@/admin/actions/get-repuestos.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { aceptarCotizacionAction } from '@/admin/actions/aceptar-cotizacion.action';
import type {
  CotizacionItem,
  CotizacionDetalleInventarioItem,
} from '@/admin/interfaces/cotizacion.interface';
import type { RepuestoItem } from '@/admin/interfaces/repuesto.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';

export const AceptarCotizacionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Cotización
  const {
    data: cotizacion,
    isLoading: isLoadingCotizacion,
    isError: isErrorCotizacion,
  } = useQuery<CotizacionItem | null>({
    queryKey: ['cotizacion-detalle', id],
    queryFn: () => getCotizacionByIdAction(id || ''),
    enabled: !!id,
  });

  // 2. Cargar Repuestos para seleccionar piezas físicas en stock
  const { data: repuestos = [], isLoading: isLoadingRepuestos } = useQuery<RepuestoItem[]>({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
  });

  // 3. Cargar Inventario para selección de tipo de equipo (compresor/válvula)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // ==========================================
  // ESTADOS DEL FORMULARIO SEGÚN CASO
  // ==========================================

  // CASO 1 (Venta): Asignación de repuestos físicos salientes { [lineIndex]: id_repuesto_saliente }
  const [repuestosSalientesVenta, setRepuestosSalientesVenta] = useState<Record<number, number>>({});

  // CASO 2 (Recambio): { [lineIndex]: { id_repuesto_saliente, serial_entrante, service_tag_entrante } }
  const [recambioDetalles, setRecambioDetalles] = useState<
    Record<
      number,
      {
        id_repuesto_saliente: number | '';
        serial_entrante: string;
        service_tag_entrante: string;
      }
    >
  >({});

  // CASO 3 (Reparación): Fecha entrega y equipos entrantes
  const [fechaEntregaReparacion, setFechaEntregaReparacion] = useState<string>('');
  const [repuestosEntrantesReparacion, setRepuestosEntrantesReparacion] = useState<
    Array<{
      service_tag: string;
      serial: string;
      id_inventario: number | '';
    }>
  >([]);

  // Inicializar arreglo de reparación cuando cotización esté disponible
  React.useEffect(() => {
    if (cotizacion?.services_tags_repuestos_a_reparar) {
      const tags = Array.isArray(cotizacion.services_tags_repuestos_a_reparar)
        ? cotizacion.services_tags_repuestos_a_reparar
        : [];

      setRepuestosEntrantesReparacion(
        tags.map((tag) => ({
          service_tag: tag,
          serial: '',
          id_inventario: '',
        }))
      );
    }
  }, [cotizacion]);

  // Tipo de cotización y orden normalizados
  const tipoCotizacion = cotizacion?.tipo; // 'inicial' | 'extra'
  const tipoOrdenNombre = useMemo(() => {
    return (cotizacion?.tipo_orden?.nombre || '').toLowerCase().trim();
  }, [cotizacion]);

  // Filtro de líneas de detalles de inventario
  const detallesInventario = useMemo(() => {
    return cotizacion?.detallesInventario || cotizacion?.detalles_inventario || [];
  }, [cotizacion]);

  // Filtrado de líneas para Venta (sólo repuestos serializados: id_inventario_repuesto_saliente != null)
  // Modelos expandidos por cada UNIDAD física (si una línea tiene cantidad: 2, se crean 2 selectores individuales)
  interface ItemUnitarioVenta {
    unitIndex: number;
    lineIndex: number;
    subIndex: number; // 1 de 2, etc.
    id_inventario: number;
    lineaOriginal: CotizacionDetalleInventarioItem;
  }

  const itemsVentaUnitarios = useMemo<ItemUnitarioVenta[]>(() => {
    const items: ItemUnitarioVenta[] = [];
    let currentIdx = 0;
    detallesInventario.forEach((det, lineIdx) => {
      if (det.id_inventario_repuesto_saliente !== null && det.id_inventario_repuesto_saliente !== undefined) {
        const cant = Math.max(1, Number(det.cantidad) || 1);
        for (let sub = 1; sub <= cant; sub++) {
          items.push({
            unitIndex: currentIdx++,
            lineIndex: lineIdx,
            subIndex: sub,
            id_inventario: det.id_inventario_repuesto_saliente,
            lineaOriginal: det,
          });
        }
      }
    });
    return items;
  }, [detallesInventario]);

  interface ItemUnitarioRecambio {
    unitIndex: number;
    lineIndex: number;
    subIndex: number;
    id_inventario: number;
    lineaOriginal: CotizacionDetalleInventarioItem;
  }

  const itemsRecambioUnitarios = useMemo<ItemUnitarioRecambio[]>(() => {
    const items: ItemUnitarioRecambio[] = [];
    let currentIdx = 0;
    detallesInventario.forEach((det, lineIdx) => {
      if (det.id_inventario_repuesto_saliente !== null && det.id_inventario_repuesto_saliente !== undefined) {
        const cant = Math.max(1, Number(det.cantidad) || 1);
        for (let sub = 1; sub <= cant; sub++) {
          items.push({
            unitIndex: currentIdx++,
            lineIndex: lineIdx,
            subIndex: sub,
            id_inventario: det.id_inventario_repuesto_saliente,
            lineaOriginal: det,
          });
        }
      }
    });
    return items;
  }, [detallesInventario]);

  // Catálogo de inventario para equipos de taller (compresor o válvula, condición 'usado')
  const inventarioParaReparacion = useMemo(() => {
    return inventario.filter((item) => {
      const tipoValido = item.tipo === 'compresor' || item.tipo === 'valvula';
      const condicionUsada = !item.condicion || item.condicion.toLowerCase() === 'usado';
      return tipoValido && condicionUsada;
    });
  }, [inventario]);

  // Mapa de repuestos disponibles en taller por id_inventario
  // Regla: propietario === true && !id_orden_salida
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

  // Mutación para Aceptar Cotización
  const aceptarMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => {
      if (!id) throw new Error('ID de cotización no especificado');
      return aceptarCotizacionAction(id, payload);
    },
    onSuccess: () => {
      toast.success(`Cotización #${cotizacion?.num_cotizacion} aceptada exitosamente.`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['cotizacion-detalle', id] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-stock'] });
      navigate('/admin/cotizaciones/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al aceptar la cotización';
      toast.error(msg);
    },
  });

  // Manejo del Envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cotizacion) return;

    // CASO 0: Cotización Extra
    if (tipoCotizacion === 'extra') {
      aceptarMutation.mutate({});
      return;
    }

    // CASO 1: Venta Inicial
    if (tipoOrdenNombre === 'venta') {
      const detallesPayload: Array<{ id_repuesto_saliente: number }> = [];

      for (let i = 0; i < itemsVentaUnitarios.length; i++) {
        const itemUnitario = itemsVentaUnitarios[i];
        const idRepuesto = repuestosSalientesVenta[itemUnitario.unitIndex];
        if (!idRepuesto) {
          toast.warning(`Debes seleccionar el repuesto físico en bodega para la unidad #${itemUnitario.subIndex} de "${itemUnitario.lineaOriginal.inventarioRepuestoSaliente?.nombre || 'Repuesto'}"`);
          return;
        }
        detallesPayload.push({ id_repuesto_saliente: Number(idRepuesto) });
      }

      // Validar repuestos duplicados seleccionados
      const idsSet = new Set(detallesPayload.map((d) => d.id_repuesto_saliente));
      if (idsSet.size !== detallesPayload.length) {
        toast.warning('No puedes seleccionar el mismo repuesto físico en bodega en más de una unidad.');
        return;
      }

      aceptarMutation.mutate({
        detalles: detallesPayload,
      });
      return;
    }

    // CASO 2: Recambio Inicial
    if (tipoOrdenNombre === 'recambio') {
      const detallesPayload: Array<{
        id_repuesto_saliente: number;
        serial_entrante: string;
        service_tag_entrante: string;
      }> = [];

      for (let i = 0; i < itemsRecambioUnitarios.length; i++) {
        const itemUnitario = itemsRecambioUnitarios[i];
        const rec = recambioDetalles[itemUnitario.unitIndex];
        if (!rec || !rec.id_repuesto_saliente) {
          toast.warning(`Debes seleccionar la pieza física que sale para la unidad #${itemUnitario.subIndex} de "${itemUnitario.lineaOriginal.inventarioRepuestoSaliente?.nombre || 'Recambio'}"`);
          return;
        }
        if (!rec.serial_entrante.trim()) {
          toast.warning(`Debes ingresar el número de serial de la pieza entrante del cliente para la unidad #${itemUnitario.subIndex}`);
          return;
        }
        if (!rec.service_tag_entrante.trim()) {
          toast.warning(`Debes ingresar el service tag descriptivo para la pieza entrante en la unidad #${itemUnitario.subIndex}`);
          return;
        }

        detallesPayload.push({
          id_repuesto_saliente: Number(rec.id_repuesto_saliente),
          serial_entrante: rec.serial_entrante.trim(),
          service_tag_entrante: rec.service_tag_entrante.trim(),
        });
      }

      // Validar repuestos salientes duplicados
      const idsSet = new Set(detallesPayload.map((d) => d.id_repuesto_saliente));
      if (idsSet.size !== detallesPayload.length) {
        toast.warning('No puedes seleccionar la misma pieza física saliente en más de una unidad.');
        return;
      }

      // Validar service_tags de las piezas entrantes
      const serviceTagsSet = new Set(detallesPayload.map((d) => d.service_tag_entrante));
      if (serviceTagsSet.size !== detallesPayload.length) {
        toast.warning('No puedes seleccionar el mismo service_tag entrante en más de una unidad.');
        return;
      }

      aceptarMutation.mutate({
        detalles: detallesPayload,
      });
      return;
    }

    // CASO 3: Reparación Inicial
    if (tipoOrdenNombre === 'reparacion') {
      if (!fechaEntregaReparacion) {
        toast.warning('Debes seleccionar la fecha estimada de entrega de la reparación');
        return;
      }

      const repuestosEntrantesPayload: Array<{
        id_inventario: number;
        serial: string;
        service_tag: string;
      }> = [];

      for (let i = 0; i < repuestosEntrantesReparacion.length; i++) {
        const item = repuestosEntrantesReparacion[i];
        if (!item.id_inventario) {
          toast.warning(`Debes seleccionar el tipo de equipo/modelo en inventario para el equipo #${i + 1} (${item.service_tag})`);
          return;
        }
        if (!item.serial.trim()) {
          toast.warning(`Debes ingresar el serial de fábrica del equipo #${i + 1} (${item.service_tag})`);
          return;
        }

        repuestosEntrantesPayload.push({
          id_inventario: Number(item.id_inventario),
          serial: item.serial.trim(),
          service_tag: item.service_tag.trim(),
        });
      }

      aceptarMutation.mutate({
        fecha_entrega_reparacion: fechaEntregaReparacion,
        repuestos_entrantes: repuestosEntrantesPayload,
      });
      return;
    }

    // En caso de otro tipo no contemplado
    aceptarMutation.mutate({});
  };

  // Estados de carga generales
  if (isLoadingCotizacion || isLoadingRepuestos || isLoadingInventario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando datos de la cotización y stock disponible...
        </p>
      </div>
    );
  }

  // Estado si no existe cotización
  if (isErrorCotizacion || !cotizacion) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border/80 text-center space-y-4 max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Cotización no encontrada</h2>
        <p className="text-sm text-muted-foreground">
          No se pudo encontrar la cotización con el identificador solicitado o fue eliminada.
        </p>
        <Link
          to="/admin/cotizaciones/listado"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20 max-w-5xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título, Volver y Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              Aceptar Cotización #{cotizacion.num_cotizacion}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {tipoCotizacion}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {tipoOrdenNombre}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cliente: <span className="font-semibold text-foreground">{cotizacion.cliente?.nombre || 'No asignado'}</span>
            {cotizacion.cliente?.rut ? ` (${cotizacion.cliente.rut})` : ''} • Fecha: {cotizacion.fecha_creacion}
          </p>
        </div>

        <Link
          to="/admin/cotizaciones/listado"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================
            CASO 0: COTIZACIÓN EXTRA (DE REPARACIÓN)
            ============================================================ */}
        {tipoCotizacion === 'extra' && (
          <div className="bg-card p-6 rounded-2xl border border-emerald-500/30 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-dark-600 dark:text-dark-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Confirmación de Cotización Extra</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ¿Está seguro de que el cliente aceptó esta cotización extra? Se agregarán automáticamente los
                  insumos y servicios aprobados a la ficha de reparación en curso sin necesidad de datos adicionales.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            CASO 1: COTIZACIÓN INICIAL DE VENTA
            ============================================================ */}
        {tipoCotizacion === 'inicial' && tipoOrdenNombre === 'venta' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 text-dark-700 dark:text-dark-300">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold">Asignación de Stock Físico:</span> Por cada unidad física de repuesto serializado
                cotizado, selecciona el número de serie de bodega que se entregará al cliente.
              </div>
            </div>

            {itemsVentaUnitarios.length === 0 ? (
              <div className="bg-card p-6 rounded-2xl border border-border/80 text-center text-muted-foreground text-sm">
                Esta cotización solo contiene insumos o repuestos no serializados. Puedes proceder con la aceptación directamente.
              </div>
            ) : (
              <div className="space-y-3">
                {itemsVentaUnitarios.map((item) => {
                  const idInventario = item.id_inventario;
                  const repuestosDisponibles = repuestosDisponiblesPorInventario.get(idInventario) || [];
                  const repuestoInfo =
                    item.lineaOriginal.inventarioRepuestoSaliente ||
                    item.lineaOriginal.inventario_repuesto_saliente ||
                    inventario.find((i) => i.id_inventario === idInventario);

                  const esMultiple = (Number(item.lineaOriginal.cantidad) || 1) > 1;

                  return (
                    <div
                      key={item.unitIndex}
                      className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {item.unitIndex + 1}
                          </span>
                          <span className="font-bold text-sm text-foreground">
                            {repuestoInfo?.nombre || `Repuesto SKU #${idInventario}`}
                          </span>
                          {esMultiple && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Unidad {item.subIndex} de {item.lineaOriginal.cantidad}
                            </span>
                          )}
                          {repuestoInfo?.sku && (
                            <span className="text-xs font-mono text-muted-foreground bg-accent px-2 py-0.5 rounded">
                              {repuestoInfo.sku}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          Línea de Cotización
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Seleccionar Repuesto Físico en Bodega (Serial y Service Tag) <span className="text-rose-500">*</span>
                        </label>
                        {repuestosDisponibles.length === 0 ? (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            No hay unidades físicas disponibles en taller para este modelo (propietario = propio, sin salida).
                          </div>
                        ) : (
                          <select
                            required
                            value={repuestosSalientesVenta[item.unitIndex] || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRepuestosSalientesVenta((prev) => ({
                                ...prev,
                                [item.unitIndex]: val,
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          >
                            <option value="">-- Seleccionar pieza física en bodega --</option>
                            {repuestosDisponibles.map((r) => (
                              <option key={r.id_repuesto} value={r.id_repuesto}>
                                ID #{r.id_repuesto} | Serial: {r.serial || 'Sin serial'} | Tag: {r.service_tag || 'Sin tag'} ({r.estado})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            CASO 2: COTIZACIÓN INICIAL DE RECAMBIO
            ============================================================ */}
        {tipoCotizacion === 'inicial' && tipoOrdenNombre === 'recambio' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 text-dark-700 dark:text-dark-300">
              <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold">Intercambio de Piezas:</span> Por cada unidad de repuesto en recambio,
                asigna la pieza física del taller que sale e ingresa el serial y tag de servicio de la pieza usada que el cliente entrega.
              </div>
            </div>

            {itemsRecambioUnitarios.length === 0 ? (
              <div className="bg-card p-6 rounded-2xl border border-border/80 text-center text-muted-foreground text-sm">
                No se encontraron detalles de recambio en la cotización.
              </div>
            ) : (
              <div className="space-y-4">
                {itemsRecambioUnitarios.map((item) => {
                  const idInventario = item.id_inventario;
                  const repuestosDisponibles = repuestosDisponiblesPorInventario.get(idInventario) || [];
                  const repuestoInfo =
                    item.lineaOriginal.inventarioRepuestoSaliente ||
                    item.lineaOriginal.inventario_repuesto_saliente ||
                    inventario.find((i) => i.id_inventario === idInventario);

                  const detalleActual = recambioDetalles[item.unitIndex] || {
                    id_repuesto_saliente: '',
                    serial_entrante: '',
                    service_tag_entrante: '',
                  };

                  const esMultiple = (Number(item.lineaOriginal.cantidad) || 1) > 1;

                  return (
                    <div
                      key={item.unitIndex}
                      className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                            {item.unitIndex + 1}
                          </span>
                          <span className="font-bold text-sm text-foreground">
                            {repuestoInfo?.nombre || `Línea de Recambio #${item.unitIndex + 1}`}
                          </span>
                          {esMultiple && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Unidad {item.subIndex} de {item.lineaOriginal.cantidad}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          Línea de Cotización
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Selector de pieza física que sale */}
                        <div className="space-y-1.5 md:col-span-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Pieza de la Empresa que Sale (Bodega) <span className="text-rose-500">*</span>
                          </label>
                          {repuestosDisponibles.length === 0 ? (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              No hay unidades físicas disponibles en taller para este modelo.
                            </div>
                          ) : (
                            <select
                              required
                              value={detalleActual.id_repuesto_saliente}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : '';
                                setRecambioDetalles((prev) => ({
                                  ...prev,
                                  [item.unitIndex]: {
                                    ...detalleActual,
                                    id_repuesto_saliente: val,
                                  },
                                }));
                              }}
                              className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                            >
                              <option value="">-- Seleccionar pieza física en bodega --</option>
                              {repuestosDisponibles.map((r) => (
                                <option key={r.id_repuesto} value={r.id_repuesto}>
                                  ID #{r.id_repuesto} | Serial: {r.serial || 'Sin serial'} | Tag: {r.service_tag || 'Sin tag'} ({r.estado})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* 2. Serial entrante del cliente */}
                        <div className="space-y-1.5 md:col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Serial Pieza del Cliente <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: SN-CLI-REC-001"
                            value={detalleActual.serial_entrante}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecambioDetalles((prev) => ({
                                ...prev,
                                [item.unitIndex]: {
                                  ...detalleActual,
                                  serial_entrante: val,
                                },
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                          />
                        </div>

                        {/* 3. Service Tag o etiqueta entrante */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Nombre / Tag Descriptivo Pieza Entrante <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Compresor Usado Cliente A"
                            value={detalleActual.service_tag_entrante}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecambioDetalles((prev) => ({
                                ...prev,
                                [item.unitIndex]: {
                                  ...detalleActual,
                                  service_tag_entrante: val,
                                },
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            CASO 3: COTIZACIÓN INICIAL DE REPARACIÓN
            ============================================================ */}
        {tipoCotizacion === 'inicial' && tipoOrdenNombre === 'reparacion' && (
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3 text-dark-700 dark:text-dark-300">
              <Wrench className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold">Ingreso de Equipos a Reparar:</span> Define la fecha de entrega
                estimada e ingresa el número de serie físico de fábrica y tipo de equipo para cada tag de reparación cotizado.
              </div>
            </div>

            {/* Selector de Fecha de Entrega */}
            <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-500" />
                Fecha Estimada de Entrega de la Reparación <span className="text-rose-500">*</span>
              </label>
              <input
                min={new Date().toISOString().split('T')[0]}
                type="date"
                required
                value={fechaEntregaReparacion}
                onChange={(e) => setFechaEntregaReparacion(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
              />
            </div>

            {/* Equipos Entrantes */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Equipos Físicos a Ingresar ({repuestosEntrantesReparacion.length})
              </h3>

              {repuestosEntrantesReparacion.length === 0 ? (
                <div className="bg-card p-6 rounded-2xl border border-border/80 text-center text-muted-foreground text-sm">
                  No se registraron etiquetas de repuestos a reparar en esta cotización.
                </div>
              ) : (
                repuestosEntrantesReparacion.map((item, index) => (
                  <div
                    key={index}
                    className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        {index + 1}
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        Service Tag: {item.service_tag}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Serial grabado de fábrica */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Serial Físico de Fábrica grabado en el Equipo <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: COMP-SUPER-NEW-GEN-67TR67"
                          value={item.serial}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRepuestosEntrantesReparacion((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], serial: val };
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                        />
                      </div>

                      {/* Tipo de equipo en catálogo de inventario (compresor/valvula usado) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Tipo de Equipo / Modelo (Inventario Usado) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={item.id_inventario}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : '';
                            setRepuestosEntrantesReparacion((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], id_inventario: val };
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                          <option value="">-- Seleccionar tipo de compresor / válvula --</option>
                          {inventarioParaReparacion.map((inv) => (
                            <option key={inv.id_inventario} value={inv.id_inventario}>
                              {inv.nombre} ({inv.tipo} - {inv.condicion || 'usado'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            RESUMEN FINANCIERO Y BOTÓN DE ACCIÓN
            ============================================================ */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Total Cotizado:{' '}
            <span className="font-extrabold text-foreground text-base sm:text-lg">
              ${Number(cotizacion.monto_total).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/admin/cotizaciones/listado"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-background border border-border/80 hover:bg-accent text-foreground transition-all cursor-pointer"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={aceptarMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {aceptarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando Aceptación...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Aceptar Cotización
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
