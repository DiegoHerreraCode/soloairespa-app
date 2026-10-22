import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  XCircle,
  Trash2,
  Loader2,
  Wrench,
  Tag
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getServiciosTallerAction } from '@/admin/actions/get-servicios-taller.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { createCotizacionAction } from '@/admin/actions/create-cotizacion.action';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { ServicioTallerItem } from '@/admin/interfaces/servicio-taller.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';

// Interfaz para fila de insumo seleccionado
export interface InsumoFilaReparacion {
  id_fila: string;
  id_inventario: number;
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
  service_tag_repuesto_a_reparar: string;
}

// Interfaz para fila de servicio seleccionado
export interface ServicioFilaReparacion {
  id_fila: string;
  id_servicio_taller: number;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  monto_total_linea: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number;
  monto_total_linea_con_ganancia: number;
  porcentaje_iva: number;
  monto_iva: number;
  service_tag_repuesto_a_reparar: string;
}

export const CotizacionInicialReparacionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Cargar Inventario (Solo insumos para reparaciones)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Cargar Servicios de Taller
  const { data: serviciosCatalogo = [], isLoading: isLoadingServicios } = useQuery<ServicioTallerItem[]>({
    queryKey: ['servicios-taller'],
    queryFn: getServiciosTallerAction,
  });

  // 4. Cargar Tipos de Órdenes
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // Estados del formulario general
  const [idCliente, setIdCliente] = useState<number | ''>('');
  const [numRepuestosAReparar, setNumRepuestosAReparar] = useState<number | ''>('');
  const [inputServiceTag, setInputServiceTag] = useState<string>('');
  const [servicesTags, setServicesTags] = useState<string[]>([]);

  // Listas de Insumos y Servicios seleccionados
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoFilaReparacion[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioFilaReparacion[]>([]);

  // Búsqueda en sidebar lateral
  const [busquedaSkuInsumo, setBusquedaSkuInsumo] = useState<string>('');
  const [busquedaNombreServicio, setBusquedaNombreServicio] = useState<string>('');

  // Filtrado de inventario: Solo tipo 'insumo'
  const insumosCatalogo = useMemo(() => {
    return inventario.filter((item) => item.tipo === 'insumo');
  }, [inventario]);

  const inventarioMap = useMemo(() => {
    return new Map<number, InventarioItem>(insumosCatalogo.map((i) => [i.id_inventario, i]));
  }, [insumosCatalogo]);

  const serviciosMap = useMemo(() => {
    return new Map<number, ServicioTallerItem>(serviciosCatalogo.map((s) => [s.id_servicio_taller, s]));
  }, [serviciosCatalogo]);

  // Filtrado en sidebar de insumos
  const insumosFiltradosSidebar = useMemo(() => {
    if (!busquedaSkuInsumo.trim()) return insumosCatalogo;
    const q = busquedaSkuInsumo.toLowerCase().trim();
    return insumosCatalogo.filter(
      (item) =>
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.nombre.toLowerCase().includes(q)
    );
  }, [insumosCatalogo, busquedaSkuInsumo]);

  // Filtrado en sidebar de servicios
  const serviciosFiltradosSidebar = useMemo(() => {
    if (!busquedaNombreServicio.trim()) return serviciosCatalogo;
    const q = busquedaNombreServicio.toLowerCase().trim();
    return serviciosCatalogo.filter((s) => s.nombre.toLowerCase().includes(q));
  }, [serviciosCatalogo, busquedaNombreServicio]);

  // Resolver ID del tipo de orden 'reparacion'
  const idTipoOrdenReparacion = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'reparacion');
    return tipo ? tipo.id_tipo_orden : 2; // Fallback al id 2 si coincide
  }, [tiposOrdenes]);

  // ==========================================
  // MANEJO DE SERVICE TAGS
  // ==========================================
  const handleAgregarServiceTag = () => {
    const tag = inputServiceTag.trim().toUpperCase();
    if (!tag) {
      toast.warning('Debe ingresar un valor para el Service Tag');
      return;
    }

    if (numRepuestosAReparar === '' || Number(numRepuestosAReparar) <= 0) {
      toast.warning('Debe ingresar primero la cantidad de repuestos a reparar');
      return;
    }

    if (servicesTags.length >= Number(numRepuestosAReparar)) {
      toast.warning(
        `Ya alcanzó la cantidad máxima (${numRepuestosAReparar}) de repuestos a reparar ingresada`
      );
      return;
    }

    if (servicesTags.includes(tag)) {
      toast.warning('Este Service Tag ya ha sido agregado');
      return;
    }

    setServicesTags((prev) => [...prev, tag]);
    setInputServiceTag('');
  };

  const handleEliminarServiceTag = (tagAEliminar: string) => {
    // Al eliminar un service_tag, se eliminan todos sus insumos y servicios asociados
    setServicesTags((prev) => prev.filter((t) => t !== tagAEliminar));
    setInsumosSeleccionados((prev) =>
      prev.filter((ins) => ins.service_tag_repuesto_a_reparar !== tagAEliminar)
    );
    setServiciosSeleccionados((prev) =>
      prev.filter((srv) => srv.service_tag_repuesto_a_reparar !== tagAEliminar)
    );
    toast.info(`Service Tag ${tagAEliminar} y sus insumos/servicios asociados han sido eliminados`);
  };

  // ==========================================
  // CÁLCULOS MATEMÁTICOS DE LÍNEAS
  // ==========================================
  const calcularCostoUnitarioBaseInsumo = (itemInv: InventarioItem): number => {
    const compraProm = Number(itemInv.monto_compra_prom || itemInv.ultimo_monto_compra || 0);
    const esUsado = (itemInv.condicion || '').toLowerCase().trim() === 'usado';
    if (esUsado) {
      const reparacionProm = Number(itemInv.monto_reparacion_prom || 0);
      return Number((compraProm + reparacionProm).toFixed(2));
    }
    return Number(compraProm.toFixed(2));
  };

  const calcularValoresInsumo = (
    itemInv: InventarioItem,
    cantidad: number,
    costoUnitarioInput?: number,
    porcentajeGananciaInput?: number,
    costoConGananciaInput?: number
  ) => {
    const costoUnit =
      costoUnitarioInput !== undefined
        ? costoUnitarioInput
        : calcularCostoUnitarioBaseInsumo(itemInv);

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

  const calcularValoresServicio = (
    servCat: ServicioTallerItem,
    cantidad: number,
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
    const pctIva = Number(servCat.porcentaje_iva !== undefined ? servCat.porcentaje_iva : 19);
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

  // ==========================================
  // AGREGAR / EDITAR / ELIMINAR INSUMOS
  // ==========================================
  const handleAgregarInsumo = (itemInv: InventarioItem) => {
    const calculos = calcularValoresInsumo(itemInv, 1);
    const nuevaFila: InsumoFilaReparacion = {
      id_fila: crypto.randomUUID(),
      id_inventario: itemInv.id_inventario,
      sku: itemInv.sku || 'N/A',
      nombre: itemInv.nombre,
      cantidad: 1,
      ...calculos,
      service_tag_repuesto_a_reparar: servicesTags.length === 1 ? servicesTags[0] : '',
    };

    setInsumosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  const handleActualizarInsumo = (
    index: number,
    campo: 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia' | 'service_tag_repuesto_a_reparar',
    valor: any
  ) => {
    setInsumosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const itemInv = inventarioMap.get(target.id_inventario);

      if (campo === 'service_tag_repuesto_a_reparar') {
        const nuevoTag = String(valor);
        // Validar que un mismo service_tag no puede tener más de una vez asociado el mismo insumo
        if (nuevoTag) {
          const yaAsociado = actual.some(
            (ins, i) =>
              i !== index &&
              ins.id_inventario === target.id_inventario &&
              ins.service_tag_repuesto_a_reparar === nuevoTag
          );
          if (yaAsociado) {
            toast.warning(`El insumo "${target.nombre}" ya está asociado al Service Tag "${nuevoTag}"`);
            return prev;
          }
        }

        actual[index] = { ...target, service_tag_repuesto_a_reparar: nuevoTag };
        return actual;
      }

      if (!itemInv) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, Number(valor)) : target.cantidad;
      const nuevoPctGan = campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, Number(valor))) : undefined;
      const nuevoCostoConGan = campo === 'costo_unitario_con_ganancia' ? Math.max(0, Number(valor)) : undefined;

      const nuevosCalculos = calcularValoresInsumo(
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

  const handleRemoverInsumo = (id_fila: string) => {
    setInsumosSeleccionados((prev) => prev.filter((i) => i.id_fila !== id_fila));
  };

  // ==========================================
  // AGREGAR / EDITAR / ELIMINAR SERVICIOS
  // ==========================================
  const handleAgregarServicio = (servCat: ServicioTallerItem) => {
    const calculos = calcularValoresServicio(servCat, 1);
    const nuevaFila: ServicioFilaReparacion = {
      id_fila: crypto.randomUUID(),
      id_servicio_taller: servCat.id_servicio_taller,
      nombre: servCat.nombre,
      cantidad: 1,
      ...calculos,
      service_tag_repuesto_a_reparar: servicesTags.length === 1 ? servicesTags[0] : '',
    };

    setServiciosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  const handleActualizarServicio = (
    index: number,
    campo: 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia' | 'service_tag_repuesto_a_reparar',
    valor: any
  ) => {
    setServiciosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const servCat = serviciosMap.get(target.id_servicio_taller);

      if (campo === 'service_tag_repuesto_a_reparar') {
        const nuevoTag = String(valor);
        // Validar que un mismo service_tag no puede tener más de una vez asociado el mismo servicio
        if (nuevoTag) {
          const yaAsociado = actual.some(
            (srv, i) =>
              i !== index &&
              srv.id_servicio_taller === target.id_servicio_taller &&
              srv.service_tag_repuesto_a_reparar === nuevoTag
          );
          if (yaAsociado) {
            toast.warning(`El servicio "${target.nombre}" ya está asociado al Service Tag "${nuevoTag}"`);
            return prev;
          }
        }

        actual[index] = { ...target, service_tag_repuesto_a_reparar: nuevoTag };
        return actual;
      }

      if (!servCat) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, Number(valor)) : target.cantidad;
      const nuevoPctGan = campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, Number(valor))) : undefined;
      const nuevoCostoConGan = campo === 'costo_unitario_con_ganancia' ? Math.max(0, Number(valor)) : undefined;

      const nuevosCalculos = calcularValoresServicio(
        servCat,
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

  const handleRemoverServicio = (id_fila: string) => {
    setServiciosSeleccionados((prev) => prev.filter((s) => s.id_fila !== id_fila));
  };

  // ==========================================
  // TOTALES ECONÓMICOS DE LA COTIZACIÓN
  // ==========================================
  const totales = useMemo(() => {
    let gravado = 0;
    let exento = 0;
    let iva = 0;

    // Sumar insumos
    for (const ins of insumosSeleccionados) {
      if (ins.porcentaje_iva > 0) {
        gravado += ins.monto_total_linea_con_ganancia;
        iva += ins.monto_iva;
      } else {
        exento += ins.monto_total_linea_con_ganancia;
      }
    }

    // Sumar servicios
    for (const srv of serviciosSeleccionados) {
      if (srv.porcentaje_iva > 0) {
        gravado += srv.monto_total_linea_con_ganancia;
        iva += srv.monto_iva;
      } else {
        exento += srv.monto_total_linea_con_ganancia;
      }
    }

    const total = gravado + exento + iva;

    return {
      gravado: Number(gravado.toFixed(2)),
      exento: Number(exento.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [insumosSeleccionados, serviciosSeleccionados]);

  // Mutación para crear la cotización de reparación
  const createMutation = useMutation({
    mutationFn: createCotizacionAction,
    onSuccess: (cotCreada) => {
      toast.success(
        `Cotización de reparación ${cotCreada?.num_cotizacion ? '#' + cotCreada.num_cotizacion : ''} creada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      navigate('/admin/cotizaciones/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la cotización de reparación';
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

    if (!numRepuestosAReparar || Number(numRepuestosAReparar) <= 0) {
      toast.warning('Debe indicar la cantidad de repuestos a reparar (num_repuestos_a_reparar)');
      return;
    }

    const cantEsperada = Number(numRepuestosAReparar);

    // Validar cantidad de service_tags
    if (servicesTags.length !== cantEsperada) {
      toast.warning(
        `Debe ingresar exactamente ${cantEsperada} Service Tags de repuestos a reparar (actualmente tiene ${servicesTags.length})`
      );
      return;
    }

    // Validar service_tags duplicados
    const tagsSet = new Set(servicesTags);
    if (tagsSet.size !== servicesTags.length) {
      toast.warning('No pueden haber Service Tags iguales o duplicados');
      return;
    }

    if (insumosSeleccionados.length === 0 && serviciosSeleccionados.length === 0) {
      toast.warning('Debe agregar al menos un insumo o un servicio a la cotización');
      return;
    }

    // Validar que cada insumo tenga un service_tag asignado
    for (let i = 0; i < insumosSeleccionados.length; i++) {
      const ins = insumosSeleccionados[i];
      if (!ins.service_tag_repuesto_a_reparar) {
        toast.warning(`Insumo #${i + 1} (${ins.nombre}): Debe seleccionar el Service Tag asociado`);
        return;
      }
    }

    // Validar que cada servicio tenga un service_tag asignado
    for (let i = 0; i < serviciosSeleccionados.length; i++) {
      const srv = serviciosSeleccionados[i];
      if (!srv.service_tag_repuesto_a_reparar) {
        toast.warning(`Servicio #${i + 1} (${srv.nombre}): Debe seleccionar el Service Tag asociado`);
        return;
      }
    }

    // Validar que un mismo service_tag no tenga duplicado el mismo insumo
    const insumosCombinaciones = new Set<string>();
    for (const ins of insumosSeleccionados) {
      const key = `${ins.service_tag_repuesto_a_reparar}-${ins.id_inventario}`;
      if (insumosCombinaciones.has(key)) {
        toast.warning(
          `El Service Tag "${ins.service_tag_repuesto_a_reparar}" tiene asignado más de una vez el insumo "${ins.nombre}"`
        );
        return;
      }
      insumosCombinaciones.add(key);
    }

    // Validar que un mismo service_tag no tenga duplicado el mismo servicio
    const serviciosCombinaciones = new Set<string>();
    for (const srv of serviciosSeleccionados) {
      const key = `${srv.service_tag_repuesto_a_reparar}-${srv.id_servicio_taller}`;
      if (serviciosCombinaciones.has(key)) {
        toast.warning(
          `El Service Tag "${srv.service_tag_repuesto_a_reparar}" tiene asignado más de una vez el servicio "${srv.nombre}"`
        );
        return;
      }
      serviciosCombinaciones.add(key);
    }

    // Construcción del Payload
    const payload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenReparacion),
      num_repuestos_a_reparar: cantEsperada,
      services_tags_repuestos_a_reparar: servicesTags,
      detalles_inventario: insumosSeleccionados.map((ins) => ({
        service_tag_repuesto_a_reparar: ins.service_tag_repuesto_a_reparar,
        id_inventario_insumo_saliente: Number(ins.id_inventario),
        cantidad: Number(ins.cantidad),
        precio_unitario: Number(ins.costo_unitario_con_ganancia),
        porcentaje_iva: Number(ins.porcentaje_iva),
      })),
      detalles_servicios: serviciosSeleccionados.map((srv) => ({
        service_tag_repuesto_a_reparar: srv.service_tag_repuesto_a_reparar,
        id_servicio_taller: Number(srv.id_servicio_taller),
        cantidad: Number(srv.cantidad),
        precio_unitario: Number(srv.costo_unitario_con_ganancia),
        porcentaje_iva: Number(srv.porcentaje_iva),
      })),
    };

    createMutation.mutate(payload);
  };

  const isLoadingGlobal =
    isLoadingClientes || isLoadingInventario || isLoadingServicios || isLoadingTiposOrdenes;

  if (isLoadingGlobal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando catálogo e información para cotización de reparación...
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
            <Wrench className="w-7 h-7 text-blue-500" />
            Registrar Nueva Cotización de Reparación
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cotización inicial de reparación con asignación de insumos y servicios por cada equipo
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
        {/* 2. SELECTOR DE CLIENTE Y SERVICE TAGS */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Selector de Cliente */}
            <div className="md:col-span-4 space-y-1.5">
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

            {/* Cantidad de Repuestos a Reparar */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Repuestos a Reparar <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="Cantidad..."
                value={numRepuestosAReparar}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
                  setNumRepuestosAReparar(val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              />
            </div>

            {/* Input y Botón para agregar Service Tag */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ingrese Service Tag <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ej: COMP-GEN-01"
                    value={inputServiceTag}
                    onChange={(e) => setInputServiceTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAgregarServiceTag();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAgregarServiceTag}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                  title="Agregar Service Tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bloque visual de Service Tags agregados con ícono de basura al hacer hover */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Service Tags Registrados ({servicesTags.length} de {numRepuestosAReparar || '?'})
              </span>
              <span className="text-[11px] text-muted-foreground italic">
                Pasa el mouse sobre un tag para eliminarlo
              </span>
            </div>

            {servicesTags.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-muted/20 border border-border/60 text-xs text-muted-foreground">
                No hay Service Tags agregados aún. Escribe el tag y presiona Enter o el botón (+).
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {servicesTags.map((tag) => (
                  <div
                    key={tag}
                    className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs hover:border-rose-500/50 hover:bg-rose-500/5 transition-all font-mono text-xs font-bold text-foreground"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleEliminarServiceTag(tag)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-rose-500 hover:bg-rose-500/20 cursor-pointer"
                      title={`Eliminar ${tag} y sus insumos/servicios`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. LISTA DE INSUMOS SELECCIONADOS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Lista de Insumos Seleccionados
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {insumosSeleccionados.length} {insumosSeleccionados.length === 1 ? 'insumo' : 'insumos'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Tabla de Insumos */}
            <div className="lg:col-span-9 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[950px]">
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
                      <th className="py-2.5 px-3 text-center">service tag repuesto a reparar</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {insumosSeleccionados.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-8 text-center text-muted-foreground text-xs">
                          No hay insumos seleccionados. Puedes agregarlos desde el panel "Buscar por SKU".
                        </td>
                      </tr>
                    ) : (
                      insumosSeleccionados.map((ins, idx) => (
                        <tr key={ins.id_fila} className="hover:bg-accent/40 transition-colors text-center">
                          {/* sku */}
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs whitespace-nowrap">
                            {ins.sku}
                          </td>

                          {/* nombre */}
                          <td className="py-2.5 px-3 font-medium text-foreground text-xs max-w-[150px] truncate" title={ins.nombre}>
                            {ins.nombre}
                          </td>

                          {/* cantidad */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={ins.cantidad}
                              onChange={(e) =>
                                handleActualizarInsumo(idx, 'cantidad', e.target.value)
                              }
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* costo unitario (no editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(ins.costo_unitario).toFixed(2)}
                          </td>

                          {/* monto total linea */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(ins.monto_total_linea).toFixed(2)}
                          </td>

                          {/* porcentaje de ganancia (editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            <div className="inline-flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                max={99.99}
                                step="any"
                                value={ins.porcentaje_ganancia}
                                onChange={(e) =>
                                  handleActualizarInsumo(idx, 'porcentaje_ganancia', e.target.value)
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
                                value={ins.costo_unitario_con_ganancia}
                                onChange={(e) =>
                                  handleActualizarInsumo(idx, 'costo_unitario_con_ganancia', e.target.value)
                                }
                                className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>

                          {/* monto total linea con ganancia */}
                          <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                            ${Number(ins.monto_total_linea_con_ganancia).toFixed(2)}
                          </td>

                          {/* porcentaje de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {Number(ins.porcentaje_iva).toFixed(1)}%
                          </td>

                          {/* monto de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(ins.monto_iva).toFixed(2)}
                          </td>

                          {/* selector service_tag_repuesto_a_reparar */}
                          <td className="py-2.5 px-3 text-center">
                            <select
                              required
                              value={ins.service_tag_repuesto_a_reparar}
                              onChange={(e) =>
                                handleActualizarInsumo(idx, 'service_tag_repuesto_a_reparar', e.target.value)
                              }
                              className="w-36 px-2 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">-- Service Tag --</option>
                              {servicesTags.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* acción remover */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverInsumo(ins.id_fila)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remover insumo"
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
                    value={busquedaSkuInsumo}
                    onChange={(e) => setBusquedaSkuInsumo(e.target.value)}
                    placeholder="Filtrar insumo..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {insumosFiltradosSidebar.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No se encontraron insumos
                  </p>
                ) : (
                  insumosFiltradosSidebar.slice(0, 20).map((item) => (
                    <div
                      key={item.id_inventario}
                      className="pt-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-semibold block truncate text-foreground">
                          {item.nombre}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                          <span>SKU: {item.sku || 'N/A'}</span>
                          <span>•</span>
                          <span>Stock: {item.cantidad_propia}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAgregarInsumo(item)}
                        className="p-1 rounded-lg shrink-0 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                        title="Agregar a la cotización"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. LISTA DE SERVICIOS DEL TALLER SELECCIONADOS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Lista de Servicios del Taller Seleccionados
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {serviciosSeleccionados.length} {serviciosSeleccionados.length === 1 ? 'servicio' : 'servicios'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Tabla de Servicios */}
            <div className="lg:col-span-9 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3 text-center">nombre</th>
                      <th className="py-2.5 px-3 text-center">cantidad</th>
                      <th className="py-2.5 px-3 text-center">costo unitario</th>
                      <th className="py-2.5 px-3 text-center">monto total linea</th>
                      <th className="py-2.5 px-3 text-center">porcentaje de ganancia</th>
                      <th className="py-2.5 px-3 text-center">costo unitario con ganancia</th>
                      <th className="py-2.5 px-3 text-center">monto total linea con ganancia</th>
                      <th className="py-2.5 px-3 text-center">porcentaje de iva</th>
                      <th className="py-2.5 px-3 text-center">monto de iva</th>
                      <th className="py-2.5 px-3 text-center">service tag repuesto a reparar</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {serviciosSeleccionados.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-muted-foreground text-xs">
                          No hay servicios seleccionados. Puedes agregarlos desde el panel "Buscar por nombre".
                        </td>
                      </tr>
                    ) : (
                      serviciosSeleccionados.map((srv, idx) => (
                        <tr key={srv.id_fila} className="hover:bg-accent/40 transition-colors text-center">
                          {/* nombre */}
                          <td className="py-2.5 px-3 font-semibold text-foreground text-xs max-w-[180px] truncate" title={srv.nombre}>
                            {srv.nombre}
                          </td>

                          {/* cantidad */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={srv.cantidad}
                              onChange={(e) =>
                                handleActualizarServicio(idx, 'cantidad', e.target.value)
                              }
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* costo unitario (no editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(srv.costo_unitario).toFixed(2)}
                          </td>

                          {/* monto total linea */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(srv.monto_total_linea).toFixed(2)}
                          </td>

                          {/* porcentaje de ganancia (editable) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            <div className="inline-flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                max={99.99}
                                step="any"
                                value={srv.porcentaje_ganancia}
                                onChange={(e) =>
                                  handleActualizarServicio(idx, 'porcentaje_ganancia', e.target.value)
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
                                value={srv.costo_unitario_con_ganancia}
                                onChange={(e) =>
                                  handleActualizarServicio(idx, 'costo_unitario_con_ganancia', e.target.value)
                                }
                                className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>

                          {/* monto total linea con ganancia */}
                          <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                            ${Number(srv.monto_total_linea_con_ganancia).toFixed(2)}
                          </td>

                          {/* porcentaje de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {Number(srv.porcentaje_iva).toFixed(1)}%
                          </td>

                          {/* monto de iva */}
                          <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            ${Number(srv.monto_iva).toFixed(2)}
                          </td>

                          {/* selector service_tag_repuesto_a_reparar */}
                          <td className="py-2.5 px-3 text-center">
                            <select
                              required
                              value={srv.service_tag_repuesto_a_reparar}
                              onChange={(e) =>
                                handleActualizarServicio(idx, 'service_tag_repuesto_a_reparar', e.target.value)
                              }
                              className="w-36 px-2 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">-- Service Tag --</option>
                              {servicesTags.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* acción remover */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverServicio(srv.id_fila)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remover servicio"
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

            {/* Sidebar lateral: Buscar por nombre */}
            <div className="lg:col-span-3 bg-card rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground block">Buscar por nombre</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaNombreServicio}
                    onChange={(e) => setBusquedaNombreServicio(e.target.value)}
                    placeholder="Filtrar servicio..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {serviciosFiltradosSidebar.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No se encontraron servicios
                  </p>
                ) : (
                  serviciosFiltradosSidebar.slice(0, 20).map((srv) => (
                    <div
                      key={srv.id_servicio_taller}
                      className="pt-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-semibold block truncate text-foreground">
                          {srv.nombre}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Base: ${Number(srv.costo_base || 0).toLocaleString('es-CL')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAgregarServicio(srv)}
                        className="p-1 rounded-lg shrink-0 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                        title="Agregar a la cotización"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. TOTALES ECONÓMICOS DE LA COTIZACIÓN */}
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

        {/* 6. BOTÓN GENERAR */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              (insumosSeleccionados.length === 0 && serviciosSeleccionados.length === 0)
            }
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

export default CotizacionInicialReparacionFormPage;
