import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  XCircle,
  Loader2,
  FilePlus,
} from 'lucide-react';

import { getReparacionesAction } from '@/admin/actions/get-reparaciones.action';
import { getReparacionesInsumosAction } from '@/admin/actions/get-reparaciones-insumos.action';
import { getReparacionesServiciosTallerAction } from '@/admin/actions/get-reparaciones-servicios-taller.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getServiciosTallerAction } from '@/admin/actions/get-servicios-taller.action';
import { createCotizacionExtraAction } from '@/admin/actions/create-cotizacion-extra.action';

import type { ReparacionItem, ReparacionInsumoItem, ReparacionServicioTallerItem } from '@/admin/interfaces/reparacion.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { ServicioTallerItem } from '@/admin/interfaces/servicio-taller.interface';

// Fila de Insumo para Cotización Extra
export interface InsumoExtraFila {
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
  service_tag: string;
  esDeReparacionOriginal: boolean; // Si ya formaba parte de la reparación -> porcentaje_ganancia y costo_unitario_con_ganancia son read only
}

// Fila de Servicio para Cotización Extra
export interface ServicioExtraFila {
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
  service_tag: string;
  esDeReparacionOriginal: boolean; // Si ya formaba parte de la reparación -> read only
}

export const CotizacionExtraFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Todas las Reparaciones
  const { data: todasLasReparaciones = [], isLoading: isLoadingReparaciones } = useQuery<ReparacionItem[]>({
    queryKey: ['reparaciones-listado'],
    queryFn: getReparacionesAction,
  });

  // 2. Cargar Insumos y Servicios globales de reparaciones
  const { data: todosLosInsumos = [] } = useQuery<ReparacionInsumoItem[]>({
    queryKey: ['reparaciones-insumos'],
    queryFn: getReparacionesInsumosAction,
  });

  const { data: todosLosServicios = [] } = useQuery<ReparacionServicioTallerItem[]>({
    queryKey: ['reparaciones-servicios-taller'],
    queryFn: getReparacionesServiciosTallerAction,
  });

  // 3. Cargar Catálogo de Inventario (Solo insumos)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 4. Cargar Catálogo de Servicios de Taller
  const { data: serviciosCatalogo = [], isLoading: isLoadingServicios } = useQuery<ServicioTallerItem[]>({
    queryKey: ['servicios-taller'],
    queryFn: getServiciosTallerAction,
  });

  // Estado de la reparación seleccionada
  const [idReparacionSeleccionada, setIdReparacionSeleccionada] = useState<number | ''>('');

  // Filas en las tablas
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoExtraFila[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioExtraFila[]>([]);

  // Búsqueda en sidebar lateral
  const [busquedaSkuInsumo, setBusquedaSkuInsumo] = useState('');
  const [busquedaNombreServicio, setBusquedaNombreServicio] = useState('');

  // Mapas de ayuda
  const insumosCatalogo = useMemo(() => inventario.filter((i) => i.tipo === 'insumo'), [inventario]);
  const inventarioMap = useMemo(() => new Map<number, InventarioItem>(insumosCatalogo.map((i) => [i.id_inventario, i])), [insumosCatalogo]);
  const serviciosCatalogoMap = useMemo(() => new Map<number, ServicioTallerItem>(serviciosCatalogo.map((s) => [s.id_servicio_taller, s])), [serviciosCatalogo]);

  // Filtrado de Reparaciones según especificación del boceto:
  // "El select de las reparaciones debe estar filtrado por aquellas que tengan una orden asociada y que no esten ni finalizadas ni anuladas."
  const reparacionesDisponibles = useMemo(() => {
    return todasLasReparaciones.filter((rep) => {
      const tieneOrden = rep.id_orden !== null && rep.id_orden !== undefined;
      const noFinalizadaNiAnulada = rep.estado !== 'finalizada' && rep.estado !== 'anulada';
      return tieneOrden && noFinalizadaNiAnulada;
    });
  }, [todasLasReparaciones]);

  // Objeto de la reparación seleccionada
  const reparacionSeleccionada = useMemo(() => {
    if (!idReparacionSeleccionada) return null;
    return todasLasReparaciones.find((r) => r.id_reparacion === Number(idReparacionSeleccionada)) || null;
  }, [idReparacionSeleccionada, todasLasReparaciones]);

  // Service Tag del repuesto de la reparación seleccionada
  const serviceTagReparacion = useMemo(() => {
    if (!reparacionSeleccionada) return '';
    return (
      reparacionSeleccionada.repuesto?.service_tag ||
      (reparacionSeleccionada.repuesto?.serial ? `SN: ${reparacionSeleccionada.repuesto.serial}` : `REP-#${reparacionSeleccionada.id_repuesto}`)
    );
  }, [reparacionSeleccionada]);

  // Insumos y Servicios originales de la reparación seleccionada (para preservar su condición original si son removidos y vueltos a agregar)
  const insumosOriginalesReparacionMap = useMemo(() => {
    if (!reparacionSeleccionada) return new Map<number, ReparacionInsumoItem>();
    const insOriginales = todosLosInsumos.filter(
      (ins) => ins.id_reparacion === reparacionSeleccionada.id_reparacion
    );
    return new Map<number, ReparacionInsumoItem>(insOriginales.map((ins) => [ins.id_inventario, ins]));
  }, [reparacionSeleccionada, todosLosInsumos]);

  const serviciosOriginalesReparacionMap = useMemo(() => {
    if (!reparacionSeleccionada) return new Map<number, ReparacionServicioTallerItem>();
    const srvOriginales = todosLosServicios.filter(
      (srv) => srv.id_reparacion === reparacionSeleccionada.id_reparacion
    );
    return new Map<number, ReparacionServicioTallerItem>(srvOriginales.map((srv) => [srv.id_servicio_taller, srv]));
  }, [reparacionSeleccionada, todosLosServicios]);

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
  // EFECTO: AL SELECCIONAR UNA REPARACIÓN
  // ==========================================
  // "Cuando se selecciona una reparacion, todo debe volver a su estado original,
  // y luego cargando con cantidad = 1 los insumos y servicios que esa reparacion ya tenía asociados desde la base de datos."
  useEffect(() => {
    if (!idReparacionSeleccionada || !reparacionSeleccionada) {
      setInsumosSeleccionados([]);
      setServiciosSeleccionados([]);
      return;
    }

    const sTag = serviceTagReparacion;

    // 1. Cargar insumos asociados originalmente a la reparación
    const insumosOriginales = todosLosInsumos.filter(
      (ins) => ins.id_reparacion === reparacionSeleccionada.id_reparacion
    );

    const filasInsumos: InsumoExtraFila[] = insumosOriginales.map((ins) => {
      const itemInv = ins.inventario || inventarioMap.get(ins.id_inventario);
      const costoUnit = Number(ins.costo_unitario || 0);
      const costoConGan = Number(ins.costo_unitario_con_ganancia || 0);
      const pctIva = Number(ins.porcentaje_iva || 19);

      let pctGan = Number(itemInv?.porcentaje_ganancia || 0);
      if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      }

      // Regla del boceto: cantidad = 1
      const cantidad = 1;
      const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
      const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
      const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

      return {
        id_fila: crypto.randomUUID(),
        id_inventario: ins.id_inventario,
        sku: itemInv?.sku || 'N/A',
        nombre: itemInv?.nombre || `Ítem #${ins.id_inventario}`,
        cantidad,
        costo_unitario: costoUnit,
        monto_total_linea: montoTotalLinea,
        porcentaje_ganancia: pctGan,
        costo_unitario_con_ganancia: costoConGan,
        monto_total_linea_con_ganancia: montoTotalLineaConGan,
        porcentaje_iva: pctIva,
        monto_iva: montoIva,
        service_tag: sTag,
        esDeReparacionOriginal: true, // Read only para ganancia
      };
    });

    // 2. Cargar servicios asociados originalmente a la reparación
    const serviciosOriginales = todosLosServicios.filter(
      (srv) => srv.id_reparacion === reparacionSeleccionada.id_reparacion
    );

    const filasServicios: ServicioExtraFila[] = serviciosOriginales.map((srv) => {
      const servCat = srv.servicio_taller || serviciosCatalogoMap.get(srv.id_servicio_taller);
      const costoUnit = Number(srv.costo_unitario || 0);
      const costoConGan = Number(srv.costo_unitario_con_ganancia || 0);
      const pctIva = Number(srv.porcentaje_iva || 19);

      let pctGan = Number(servCat?.porcentaje_ganancia || 0);
      if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      }

      // Regla del boceto: cantidad = 1
      const cantidad = 1;
      const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
      const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
      const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

      return {
        id_fila: crypto.randomUUID(),
        id_servicio_taller: srv.id_servicio_taller,
        nombre: servCat?.nombre || `Servicio #${srv.id_servicio_taller}`,
        cantidad,
        costo_unitario: costoUnit,
        monto_total_linea: montoTotalLinea,
        porcentaje_ganancia: pctGan,
        costo_unitario_con_ganancia: costoConGan,
        monto_total_linea_con_ganancia: montoTotalLineaConGan,
        porcentaje_iva: pctIva,
        monto_iva: montoIva,
        service_tag: sTag,
        esDeReparacionOriginal: true, // Read only para ganancia
      };
    });

    setInsumosSeleccionados(filasInsumos);
    setServiciosSeleccionados(filasServicios);
  }, [idReparacionSeleccionada, reparacionSeleccionada, todosLosInsumos, todosLosServicios, inventarioMap, serviciosCatalogoMap, serviceTagReparacion]);

  // ==========================================
  // MANEJO DE INSUMOS
  // ==========================================
  const handleAgregarInsumo = (itemInv: InventarioItem) => {
    if (!idReparacionSeleccionada) {
      toast.warning('Debe seleccionar primero una reparación');
      return;
    }

    const yaExiste = insumosSeleccionados.some((i) => i.id_inventario === itemInv.id_inventario);
    if (yaExiste) {
      toast.info('Este insumo ya se encuentra agregado en la lista');
      return;
    }

    const insumoOriginal = insumosOriginalesReparacionMap.get(itemInv.id_inventario);
    const esDeReparacionOriginal = !!insumoOriginal;

    let calculos;
    if (insumoOriginal) {
      const costoUnit = Number(insumoOriginal.costo_unitario || 0);
      const costoConGan = Number(insumoOriginal.costo_unitario_con_ganancia || 0);
      const pctIva = Number(insumoOriginal.porcentaje_iva || 19);

      let pctGan = Number(itemInv?.porcentaje_ganancia || 0);
      if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      }

      const cantidad = 1;
      const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
      const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
      const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

      calculos = {
        costo_unitario: costoUnit,
        monto_total_linea: montoTotalLinea,
        porcentaje_ganancia: pctGan,
        costo_unitario_con_ganancia: costoConGan,
        monto_total_linea_con_ganancia: montoTotalLineaConGan,
        porcentaje_iva: pctIva,
        monto_iva: montoIva,
      };
    } else {
      calculos = calcularValoresInsumo(itemInv, 1);
    }

    const nuevaFila: InsumoExtraFila = {
      id_fila: crypto.randomUUID(),
      id_inventario: itemInv.id_inventario,
      sku: itemInv.sku || 'N/A',
      nombre: itemInv.nombre,
      cantidad: 1,
      ...calculos,
      service_tag: serviceTagReparacion,
      esDeReparacionOriginal,
    };

    setInsumosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  const handleActualizarInsumo = (
    index: number,
    campo: 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia',
    valor: number
  ) => {
    setInsumosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const itemInv = inventarioMap.get(target.id_inventario);
      if (!itemInv) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, valor) : target.cantidad;
      const nuevoPctGan = campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, valor)) : undefined;
      const nuevoCostoConGan = campo === 'costo_unitario_con_ganancia' ? Math.max(0, valor) : undefined;

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
  // MANEJO DE SERVICIOS
  // ==========================================
  const handleAgregarServicio = (servCat: ServicioTallerItem) => {
    if (!idReparacionSeleccionada) {
      toast.warning('Debe seleccionar primero una reparación');
      return;
    }

    const yaExiste = serviciosSeleccionados.some((s) => s.id_servicio_taller === servCat.id_servicio_taller);
    if (yaExiste) {
      toast.info('Este servicio ya se encuentra agregado en la lista');
      return;
    }

    const servicioOriginal = serviciosOriginalesReparacionMap.get(servCat.id_servicio_taller);
    const esDeReparacionOriginal = !!servicioOriginal;

    let calculos;
    if (servicioOriginal) {
      const costoUnit = Number(servicioOriginal.costo_unitario || 0);
      const costoConGan = Number(servicioOriginal.costo_unitario_con_ganancia || 0);
      const pctIva = Number(servicioOriginal.porcentaje_iva || 19);

      let pctGan = Number(servCat?.porcentaje_ganancia || 0);
      if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
        pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
      }

      const cantidad = 1;
      const montoTotalLinea = Number((cantidad * costoUnit).toFixed(2));
      const montoTotalLineaConGan = Number((cantidad * costoConGan).toFixed(2));
      const montoIva = Number((montoTotalLineaConGan * (pctIva / 100)).toFixed(2));

      calculos = {
        costo_unitario: costoUnit,
        monto_total_linea: montoTotalLinea,
        porcentaje_ganancia: pctGan,
        costo_unitario_con_ganancia: costoConGan,
        monto_total_linea_con_ganancia: montoTotalLineaConGan,
        porcentaje_iva: pctIva,
        monto_iva: montoIva,
      };
    } else {
      calculos = calcularValoresServicio(servCat, 1);
    }

    const nuevaFila: ServicioExtraFila = {
      id_fila: crypto.randomUUID(),
      id_servicio_taller: servCat.id_servicio_taller,
      nombre: servCat.nombre,
      cantidad: 1,
      ...calculos,
      service_tag: serviceTagReparacion,
      esDeReparacionOriginal,
    };

    setServiciosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  const handleActualizarServicio = (
    index: number,
    campo: 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia',
    valor: number
  ) => {
    setServiciosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const servCat = serviciosCatalogoMap.get(target.id_servicio_taller);
      if (!servCat) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, valor) : target.cantidad;
      const nuevoPctGan = campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, valor)) : undefined;
      const nuevoCostoConGan = campo === 'costo_unitario_con_ganancia' ? Math.max(0, valor) : undefined;

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
  // SIDEBARS FILTRADOS (REGLA DE UNICIDAD)
  // "Cuando se selecciona algo, ya no debe seguir siendo seleccionable."
  // ==========================================
  const insumosFiltradosSidebar = useMemo(() => {
    const q = busquedaSkuInsumo.toLowerCase().trim();
    return insumosCatalogo.filter((item) => {
      if (!q) return true;
      return (
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.nombre.toLowerCase().includes(q)
      );
    });
  }, [insumosCatalogo, busquedaSkuInsumo]);

  const serviciosFiltradosSidebar = useMemo(() => {
    const q = busquedaNombreServicio.toLowerCase().trim();
    return serviciosCatalogo.filter((s) => {
      if (!q) return true;
      return s.nombre.toLowerCase().includes(q);
    });
  }, [serviciosCatalogo, busquedaNombreServicio]);

  // ==========================================
  // TOTALES ECONÓMICOS DE LA COTIZACIÓN EXTRA
  // ==========================================
  const totales = useMemo(() => {
    let gravado = 0;
    let exento = 0;
    let iva = 0;

    for (const ins of insumosSeleccionados) {
      if (ins.porcentaje_iva > 0) {
        gravado += ins.monto_total_linea_con_ganancia;
        iva += ins.monto_iva;
      } else {
        exento += ins.monto_total_linea_con_ganancia;
      }
    }

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

  // Mutación para crear la cotización extra
  const createMutation = useMutation({
    mutationFn: () => {
      if (!idReparacionSeleccionada) throw new Error('Debe seleccionar una reparación');

      const payload = {
        crear_cotizacion_extra: true as const,
        insumos: insumosSeleccionados.map((ins) => ({
          id_inventario_insumo_saliente: Number(ins.id_inventario),
          cantidad: Number(ins.cantidad),
          precio_unitario_base: Number(ins.costo_unitario),
          precio_unitario: Number(ins.costo_unitario_con_ganancia),
          porcentaje_iva: Number(ins.porcentaje_iva),
        })),
        servicios: serviciosSeleccionados.map((srv) => ({
          id_servicio_taller: Number(srv.id_servicio_taller),
          cantidad: Number(srv.cantidad),
          precio_unitario_base: Number(srv.costo_unitario),
          precio_unitario: Number(srv.costo_unitario_con_ganancia),
          porcentaje_iva: Number(srv.porcentaje_iva),
        })),
      };

      return createCotizacionExtraAction(idReparacionSeleccionada, payload);
    },
    onSuccess: () => {
      toast.success('Cotización extra de reparación generada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparacion-item', String(idReparacionSeleccionada)] });
      navigate('/admin/cotizaciones/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la cotización extra';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idReparacionSeleccionada) {
      toast.warning('Debe seleccionar una reparación');
      return;
    }

    if (insumosSeleccionados.length === 0 && serviciosSeleccionados.length === 0) {
      toast.warning('Debe existir al menos un insumo o servicio en la cotización extra');
      return;
    }

    createMutation.mutate();
  };

  const isLoadingGlobal = isLoadingReparaciones || isLoadingInventario || isLoadingServicios;

  if (isLoadingGlobal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando datos para cotización extra...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-7xl mx-auto">
      {/* 1. BARRA SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FilePlus className="w-7 h-7 text-blue-500" />
            Registrar Nueva Cotización Extra de Reparación
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Agregar nuevos insumos o servicios sobre una orden de reparación en curso
          </p>
        </div>

        <Link
          to="/admin/cotizaciones/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. SELECTOR DE REPARACIÓN */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2 max-w-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Seleccione la Reparación <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={idReparacionSeleccionada}
            onChange={(e) => setIdReparacionSeleccionada(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          >
            <option value="">-- Seleccione la Reparación --</option>
            {reparacionesDisponibles.map((r) => {
              const tag = r.repuesto?.service_tag || (r.repuesto?.serial ? `Serial: ${r.repuesto.serial}` : `Repuesto #${r.id_repuesto}`);
              const numOrden = r.orden?.id_orden ? `Orden #${r.orden.id_orden}` : `Orden ID ${r.id_orden}`;
              const clienteNombre = r.orden?.cliente?.nombre ? ` - ${r.orden.cliente.nombre}` : '';
              return (
                <option key={r.id_reparacion} value={r.id_reparacion}>
                  Reparación #{r.id_reparacion} ({tag}) • {numOrden}{clienteNombre} [{r.estado}]
                </option>
              );
            })}
          </select>
          {reparacionesDisponibles.length === 0 && (
            <p className="text-xs text-amber-500 font-medium">
              No hay reparaciones con orden asociada pendientes o en proceso disponibles.
            </p>
          )}
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
                          {idReparacionSeleccionada
                            ? 'No hay insumos seleccionados. Agrega desde el panel lateral "Buscar por SKU".'
                            : 'Selecciona una reparación para visualizar sus insumos.'}
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
                                handleActualizarInsumo(idx, 'cantidad', Number(e.target.value))
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

                          {/* porcentaje de ganancia (read only si ya formaba parte de la reparación) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {ins.esDeReparacionOriginal ? (
                              <span className="text-muted-foreground font-semibold">{Number(ins.porcentaje_ganancia).toFixed(1)}%</span>
                            ) : (
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={99.99}
                                  step="any"
                                  value={ins.porcentaje_ganancia}
                                  onChange={(e) =>
                                    handleActualizarInsumo(idx, 'porcentaje_ganancia', Number(e.target.value))
                                  }
                                  className="w-16 px-1.5 py-1 text-xs text-right rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-muted-foreground text-xs">%</span>
                              </div>
                            )}
                          </td>

                          {/* costo unitario con ganancia (read only si ya formaba parte de la reparación) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {ins.esDeReparacionOriginal ? (
                              <span className="text-muted-foreground font-semibold">${Number(ins.costo_unitario_con_ganancia).toFixed(2)}</span>
                            ) : (
                              <div className="inline-flex items-center gap-1 justify-center">
                                <span className="text-muted-foreground text-xs">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={ins.costo_unitario_con_ganancia}
                                  onChange={(e) =>
                                    handleActualizarInsumo(idx, 'costo_unitario_con_ganancia', Number(e.target.value))
                                  }
                                  className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            )}
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

                          {/* service tag repuesto a reparar (read only según boceto) */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-1 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground font-mono text-xs select-none" title={ins.service_tag || ''} >
                              {ins.service_tag || '-'}
                            </span>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const disponible = insumosCatalogo.find(
                          (item) => !insumosSeleccionados.some((i) => i.id_inventario === item.id_inventario)
                        );
                        if (disponible) {
                          handleAgregarInsumo(disponible);
                        } else if (insumosCatalogo.length > 0) {
                          toast.info('Los ítems encontrados ya están agregados');
                        }
                      }
                    }}
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
                  insumosFiltradosSidebar.slice(0, 20).map((item) => {
                    // "Cuando se selecciona algo, ya no debe seguir siendo seleccionable."
                    const yaSeleccionado = insumosSeleccionados.some(
                      (i) => i.id_inventario === item.id_inventario
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
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <span>SKU: {item.sku || 'N/A'}</span>
                            <span>•</span>
                            <span>Stock: {item.cantidad_propia}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAgregarInsumo(item)}
                          disabled={yaSeleccionado}
                          className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            }`}
                          title={yaSeleccionado ? 'Ya agregado' : 'Agregar insumo'}
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
                          {idReparacionSeleccionada
                            ? 'No hay servicios seleccionados. Agrega desde el panel lateral "Buscar por nombre".'
                            : 'Selecciona una reparación para visualizar sus servicios.'}
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
                                handleActualizarServicio(idx, 'cantidad', Number(e.target.value))
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

                          {/* porcentaje de ganancia (read only si ya formaba parte de la reparación) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {srv.esDeReparacionOriginal ? (
                              <span className="text-muted-foreground font-semibold">{Number(srv.porcentaje_ganancia).toFixed(1)}%</span>
                            ) : (
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={99.99}
                                  step="any"
                                  value={srv.porcentaje_ganancia}
                                  onChange={(e) =>
                                    handleActualizarServicio(idx, 'porcentaje_ganancia', Number(e.target.value))
                                  }
                                  className="w-16 px-1.5 py-1 text-xs text-right rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-muted-foreground text-xs">%</span>
                              </div>
                            )}
                          </td>

                          {/* costo unitario con ganancia (read only si ya formaba parte de la reparación) */}
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {srv.esDeReparacionOriginal ? (
                              <span className="text-muted-foreground font-semibold">${Number(srv.costo_unitario_con_ganancia).toFixed(2)}</span>
                            ) : (
                              <div className="inline-flex items-center gap-1 justify-center">
                                <span className="text-muted-foreground text-xs">$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={srv.costo_unitario_con_ganancia}
                                  onChange={(e) =>
                                    handleActualizarServicio(idx, 'costo_unitario_con_ganancia', Number(e.target.value))
                                  }
                                  className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            )}
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

                          {/* service tag repuesto a reparar (read only según boceto) */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-1 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground font-mono text-xs select-none">
                              {srv.service_tag || '-'}
                            </span>
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
                  serviciosFiltradosSidebar.slice(0, 20).map((srv) => {
                    // "Cuando se selecciona algo, ya no debe seguir siendo seleccionable."
                    const yaSeleccionado = serviciosSeleccionados.some(
                      (s) => s.id_servicio_taller === srv.id_servicio_taller
                    );

                    return (
                      <div
                        key={srv.id_servicio_taller}
                        className="pt-1.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span
                            className={`font-semibold block truncate ${yaSeleccionado ? 'text-muted-foreground line-through' : 'text-foreground'
                              }`}
                          >
                            {srv.nombre}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Base: ${Number(srv.costo_base || 0).toLocaleString('es-CL')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAgregarServicio(srv)}
                          disabled={yaSeleccionado}
                          className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            }`}
                          title={yaSeleccionado ? 'Ya agregado' : 'Agregar servicio'}
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
            disabled={createMutation.isPending || (insumosSeleccionados.length === 0 && serviciosSeleccionados.length === 0)}
            className="w-full sm:w-80 py-3 text-sm sm:text-base font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando Cotización Extra...
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

export default CotizacionExtraFormPage;
