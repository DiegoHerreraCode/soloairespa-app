import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Wrench,
  Search,
  Edit,
  XCircle,
  Layers,
  Save,
} from 'lucide-react';
import { getInventarioByIdAction } from '../../actions/get-inventario-by-id.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import { getServiciosTallerAction } from '../../actions/get-servicios-taller.action';
import {
  getInventarioReparacionBaseAction,
  syncInventarioReparacionBaseAction,
} from '../../actions/inventario-reparacion-base.action';
import type { InventarioItem } from '../../interfaces/inventario.interface';
import type { ServicioTallerItem } from '../../interfaces/servicio-taller.interface';

interface InsumoFilaBase {
  id_insumo: number;
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

interface ServicioFilaBase {
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
}

export const InventarioReparacionBasePage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Modo edición vs Solo lectura (arranca en solo lectura al igual que ReparacionFormPage)
  const [isEditingDirecto, setIsEditingDirecto] = useState(false);

  // 1. Cargar ítem principal (compresor o válvula usado)
  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventario-item', id],
    queryFn: () => getInventarioByIdAction(id!),
    enabled: !!id,
  });

  // 2. Cargar catálogo de inventario (para seleccionar insumos en el sidebar)
  const { data: inventarioCatalogo = [] } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
  });

  // 3. Cargar catálogo de servicios del taller
  const { data: serviciosCatalogo = [] } = useQuery({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
  });

  // 4. Cargar configuración base de reparación para este ítem
  const { data: baseData, isLoading: isLoadingBase } = useQuery({
    queryKey: ['inventario-reparacion-base', id],
    queryFn: () => getInventarioReparacionBaseAction(Number(id)),
    enabled: !!id,
  });

  // Estados de filas seleccionadas
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoFilaBase[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioFilaBase[]>([]);

  // Búsqueda en sidebar lateral
  const [busquedaSkuInsumo, setBusquedaSkuInsumo] = useState('');
  const [busquedaNombreServicio, setBusquedaNombreServicio] = useState('');

  // Mapas para resolución rápida
  const inventarioMap = useMemo(
    () => new Map(inventarioCatalogo.map((i) => [i.id_inventario, i])),
    [inventarioCatalogo]
  );
  const serviciosCatalogoMap = useMemo(
    () => new Map(serviciosCatalogo.map((s) => [s.id_servicio_taller, s])),
    [serviciosCatalogo]
  );

  // Insumos disponibles en el catálogo
  const insumosDisponibles = useMemo(() => {
    return inventarioCatalogo.filter((item) => {
      if (item.tipo !== 'insumo') return false;
      if (!busquedaSkuInsumo) return true;
      const q = busquedaSkuInsumo.toLowerCase().trim();
      return (
        item.sku?.toLowerCase().includes(q) ||
        item.nombre.toLowerCase().includes(q)
      );
    });
  }, [inventarioCatalogo, busquedaSkuInsumo]);

  // Servicios disponibles en el catálogo
  const serviciosDisponibles = useMemo(() => {
    return serviciosCatalogo.filter((s) => {
      if (!busquedaNombreServicio) return true;
      const q = busquedaNombreServicio.toLowerCase().trim();
      return s.nombre.toLowerCase().includes(q);
    });
  }, [serviciosCatalogo, busquedaNombreServicio]);

  // Función para sincronizar con los datos guardados en BD
  const sincronizarConDatosOriginales = useCallback(() => {
    if (!baseData) return;

    // Sincronizar insumos base
    setInsumosSeleccionados(
      (baseData.insumos || []).map((ins) => {
        const idInsumo = Number(ins.id_insumo || ins.id_inventario_insumo);
        const itemInv = inventarioMap.get(idInsumo);
        const cantidad = Number(ins.cantidad || 1);
        const costoUnit = Number(itemInv?.monto_compra_prom || ins.costo_unitario || 0);

        // Sin redondear: usar monto_venta_unitario tal cual está almacenado si existe
        const costoConGan =
          itemInv?.monto_venta_unitario !== undefined && itemInv.monto_venta_unitario !== null
            ? Number(itemInv.monto_venta_unitario)
            : Number(ins.costo_unitario_con_ganancia || 0);

        const pctIva = Number(itemInv?.porcentaje_iva ?? ins.porcentaje_iva ?? 19);

        let pctGan = Number(itemInv?.porcentaje_ganancia ?? ins.porcentaje_ganancia ?? 0);
        if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
          pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
        }

        const montoTotalLinea = cantidad * costoUnit;
        const montoTotalLineaConGan = cantidad * costoConGan;
        const montoIva = montoTotalLineaConGan * (pctIva / 100);

        return {
          id_insumo: idInsumo,
          sku: itemInv?.sku || ins.sku || 'N/A',
          nombre: itemInv?.nombre || ins.nombre || `Insumo #${idInsumo}`,
          cantidad,
          costo_unitario: costoUnit,
          monto_total_linea: montoTotalLinea,
          porcentaje_ganancia: pctGan,
          costo_unitario_con_ganancia: costoConGan,
          monto_total_linea_con_ganancia: montoTotalLineaConGan,
          porcentaje_iva: pctIva,
          monto_iva: montoIva,
        };
      })
    );

    // Sincronizar servicios base
    setServiciosSeleccionados(
      (baseData.servicios || []).map((srv) => {
        const servCat = serviciosCatalogoMap.get(srv.id_servicio_taller);
        const cantidad = Number(srv.cantidad || 1);
        const costoUnit = Number(servCat?.costo_base ?? srv.costo_unitario ?? 0);

        // Sin redondear: usar monto_venta_unitario tal cual está almacenado si existe
        const costoConGan =
          servCat?.monto_venta_unitario !== undefined && servCat.monto_venta_unitario !== null
            ? Number(servCat.monto_venta_unitario)
            : Number(srv.costo_unitario_con_ganancia || 0);

        const pctIva = 19;
        let pctGan = Number(servCat?.porcentaje_ganancia ?? srv.porcentaje_ganancia ?? 0);
        if (costoConGan > 0 && costoUnit > 0 && costoConGan >= costoUnit) {
          pctGan = Number((((costoConGan - costoUnit) / costoConGan) * 100).toFixed(2));
        }

        const montoTotalLinea = cantidad * costoUnit;
        const montoTotalLineaConGan = cantidad * costoConGan;
        const montoIva = montoTotalLineaConGan * (pctIva / 100);

        return {
          id_servicio_taller: srv.id_servicio_taller,
          nombre: servCat?.nombre || srv.nombre || `Servicio #${srv.id_servicio_taller}`,
          cantidad,
          costo_unitario: costoUnit,
          monto_total_linea: montoTotalLinea,
          porcentaje_ganancia: pctGan,
          costo_unitario_con_ganancia: costoConGan,
          monto_total_linea_con_ganancia: montoTotalLineaConGan,
          porcentaje_iva: pctIva,
          monto_iva: montoIva,
        };
      })
    );
  }, [baseData, inventarioMap, serviciosCatalogoMap]);

  useEffect(() => {
    sincronizarConDatosOriginales();
  }, [sincronizarConDatosOriginales]);

  const handleCancelarEdicion = () => {
    sincronizarConDatosOriginales();
    setIsEditingDirecto(false);
  };

  // Cálculo de valores de insumo sin redondear montos de venta
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
        : Number(itemInv.monto_compra_prom || 0);

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
    } else if (porcentajeGananciaInput !== undefined) {
      costoConGan =
        pctGan > 0 && pctGan < 100 ? costoUnit / (1 - pctGan / 100) : costoUnit;
    } else {
      // Si no se especifica ni ganancia ni costo_con_ganancia, usar monto_venta_unitario si existe
      if (itemInv.monto_venta_unitario !== undefined && itemInv.monto_venta_unitario !== null) {
        costoConGan = Number(itemInv.monto_venta_unitario);
      } else {
        costoConGan =
          pctGan > 0 && pctGan < 100 ? costoUnit / (1 - pctGan / 100) : costoUnit;
      }
    }

    const montoTotalLinea = cantidad * costoUnit;
    const montoTotalLineaConGan = cantidad * costoConGan;
    const pctIva = Number(itemInv.porcentaje_iva !== undefined ? itemInv.porcentaje_iva : 19);
    const montoIva = montoTotalLineaConGan * (pctIva / 100);

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

  // Cálculo de valores de servicio sin redondear montos de venta
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
    } else if (porcentajeGananciaInput !== undefined) {
      costoConGan =
        pctGan > 0 && pctGan < 100 ? costoUnit / (1 - pctGan / 100) : costoUnit;
    } else {
      // Si no se especifica ni ganancia ni costo_con_ganancia, usar monto_venta_unitario si existe
      if (servCat.monto_venta_unitario !== undefined && servCat.monto_venta_unitario !== null) {
        costoConGan = Number(servCat.monto_venta_unitario);
      } else {
        costoConGan =
          pctGan > 0 && pctGan < 100 ? costoUnit / (1 - pctGan / 100) : costoUnit;
      }
    }

    const montoTotalLinea = cantidad * costoUnit;
    const montoTotalLineaConGan = cantidad * costoConGan;
    const pctIva = Number(servCat.porcentaje_iva !== undefined ? servCat.porcentaje_iva : 19);
    const montoIva = montoTotalLineaConGan * (pctIva / 100);

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

  // Agregar insumo desde el sidebar
  const handleAgregarInsumo = (itemInv: InventarioItem) => {
    const yaExiste = insumosSeleccionados.some((i) => i.id_insumo === itemInv.id_inventario);
    if (yaExiste) {
      toast.info('Este insumo ya se encuentra agregado en la lista');
      return;
    }

    const calculos = calcularValoresInsumo(itemInv, 1);
    const nuevaFila: InsumoFilaBase = {
      id_insumo: itemInv.id_inventario,
      sku: itemInv.sku || 'N/A',
      nombre: itemInv.nombre,
      cantidad: 1,
      ...calculos,
    };

    setInsumosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  // Agregar servicio desde el sidebar
  const handleAgregarServicio = (servCat: ServicioTallerItem) => {
    const yaExiste = serviciosSeleccionados.some(
      (s) => s.id_servicio_taller === servCat.id_servicio_taller
    );
    if (yaExiste) {
      toast.info('Este servicio ya se encuentra agregado en la lista');
      return;
    }

    const calculos = calcularValoresServicio(servCat, 1);
    const nuevaFila: ServicioFilaBase = {
      id_servicio_taller: servCat.id_servicio_taller,
      nombre: servCat.nombre,
      cantidad: 1,
      ...calculos,
    };

    setServiciosSeleccionados((prev) => [...prev, nuevaFila]);
  };

  // Actualizar campo de insumo
  const handleActualizarInsumo = (
    index: number,
    campo: 'cantidad' | 'porcentaje_ganancia' | 'costo_unitario_con_ganancia',
    valor: number
  ) => {
    setInsumosSeleccionados((prev) => {
      const actual = [...prev];
      const target = actual[index];
      const itemInv = inventarioMap.get(target.id_insumo);
      if (!itemInv) return prev;

      const nuevaCantidad = campo === 'cantidad' ? Math.max(1, valor) : target.cantidad;
      const nuevoPctGan =
        campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, valor)) : undefined;
      const nuevoCostoConGan =
        campo === 'costo_unitario_con_ganancia' ? Math.max(0, valor) : undefined;

      const nuevosCalculos = calcularValoresInsumo(
        itemInv,
        nuevaCantidad,
        target.costo_unitario, // costo_unitario se mantiene fijo
        nuevoPctGan !== undefined
          ? nuevoPctGan
          : campo === 'costo_unitario_con_ganancia'
          ? undefined
          : target.porcentaje_ganancia,
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

  // Actualizar campo de servicio
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
      const nuevoPctGan =
        campo === 'porcentaje_ganancia' ? Math.max(0, Math.min(99.99, valor)) : undefined;
      const nuevoCostoConGan =
        campo === 'costo_unitario_con_ganancia' ? Math.max(0, valor) : undefined;

      const nuevosCalculos = calcularValoresServicio(
        servCat,
        nuevaCantidad,
        target.costo_unitario, // costo_unitario se mantiene fijo
        nuevoPctGan !== undefined
          ? nuevoPctGan
          : campo === 'costo_unitario_con_ganancia'
          ? undefined
          : target.porcentaje_ganancia,
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

  // Remover insumo
  const handleRemoverInsumo = (index: number) => {
    setInsumosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  // Remover servicio
  const handleRemoverServicio = (index: number) => {
    setServiciosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  // Totales económicos consolidados
  const totalesEconomicos = useMemo(() => {
    const costoServiciosBase = serviciosSeleccionados.reduce(
      (acc, s) => acc + s.monto_total_linea,
      0
    );
    const costoInsumosBase = insumosSeleccionados.reduce(
      (acc, i) => acc + i.monto_total_linea,
      0
    );
    const costoServiciosConGan = serviciosSeleccionados.reduce(
      (acc, s) => acc + s.monto_total_linea_con_ganancia,
      0
    );
    const costoInsumosConGan = insumosSeleccionados.reduce(
      (acc, i) => acc + i.monto_total_linea_con_ganancia,
      0
    );

    const costoTotal = costoServiciosBase + costoInsumosBase;
    const costoTotalConGan = costoServiciosConGan + costoInsumosConGan;

    const ivaServicios = serviciosSeleccionados.reduce((acc, s) => acc + s.monto_iva, 0);
    const ivaInsumos = insumosSeleccionados.reduce((acc, i) => acc + i.monto_iva, 0);
    const montoTotalIva = ivaServicios + ivaInsumos;

    return {
      valor_total_con_ganancia_num: costoTotalConGan,
      costo_servicios_base: costoServiciosBase.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      costo_insumos_base: costoInsumosBase.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      costo_servicios_con_ganancia: costoServiciosConGan.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      costo_insumos_con_ganancia: costoInsumosConGan.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      costo_total: costoTotal.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      costo_total_con_ganancia: costoTotalConGan.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      monto_total_iva: montoTotalIva.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }, [insumosSeleccionados, serviciosSeleccionados]);

  // Mutación para guardar la configuración base
  const syncMutation = useMutation({
    mutationFn: () =>
      syncInventarioReparacionBaseAction(Number(id), {
        insumos: insumosSeleccionados.map((i) => ({
          id_insumo: i.id_insumo,
          id_inventario_insumo: i.id_insumo,
          cantidad: i.cantidad,
        })),
        servicios: serviciosSeleccionados.map((s) => ({
          id_servicio_taller: s.id_servicio_taller,
          cantidad: s.cantidad,
        })),
      }),
    onSuccess: (_) => {
      toast.success('Configuración de reparación base guardada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['inventario-reparacion-base', id] });
      queryClient.invalidateQueries({ queryKey: ['inventario-item', id] });
      queryClient.invalidateQueries({ queryKey: ['inventario-catalogo'] });
      setIsEditingDirecto(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Error al guardar la configuración base';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    syncMutation.mutate();
  };

  const isReadOnly = !isEditingDirecto;

  if (isLoadingItem || isLoadingBase) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Ítem de inventario no encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. BARRA SUPERIOR: Título, Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-7 h-7 text-amber-500" />
            Configuración de Reparación Base: {itemData.nombre}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isEditingDirecto
              ? 'Edición directa de componentes y servicios que componen la reparación base'
              : 'Ficha técnica de insumos y servicios base requeridos para este modelo (Solo lectura)'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/admin/inventario/items/${id}/detalle`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Ítem
          </Link>
        </div>
      </div>

      {/* 2. ENCABEZADO: Información del Ítem de Inventario */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          {/* Ítem / SKU */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Ítem / Modelo
            </span>
            <span className="text-sm font-bold text-foreground block truncate">
              {itemData.nombre}
            </span>
            <span className="text-xs text-muted-foreground font-mono block">
              SKU: {itemData.sku || 'Sin SKU'}
            </span>
          </div>

          {/* Tipo y Condición */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Tipo / Condición
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {itemData.tipo}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {itemData.condicion || 'usado'}
              </span>
            </div>
          </div>

          {/* Existencias Físicas */}
          <div className="p-3 bg-accent/40 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-500" />
              Stock Disponible
            </span>
            <span className="text-xs font-semibold text-foreground block font-mono">
              Total: {itemData.cantidad_total} | Taller: {itemData.cantidad_propia} | Cliente: {itemData.cantidad_cliente}
            </span>
          </div>

          {/* Monto Venta Reparación Base Actual o en Tiempo Real */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Monto Venta Reparación Base
            </span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono block">
              ${(
                isEditingDirecto
                  ? totalesEconomicos.valor_total_con_ganancia_num
                  : Number(itemData.monto_venta_reparacion_base || 0)
              ).toLocaleString('es-CL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN INSUMOS (Tabla + Sidebar lateral de búsqueda si editable) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Lista de Insumos Base Seleccionados
        </h2>

        <div className={`grid grid-cols-1 ${!isReadOnly ? 'lg:grid-cols-12' : ''} gap-4 items-start`}>
          {/* Tabla de Insumos */}
          <div
            className={`${!isReadOnly ? 'lg:col-span-9' : 'w-full'
              } bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
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
                    {!isReadOnly && <th className="py-2.5 px-3 text-center">acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {insumosSeleccionados.length === 0 ? (
                    <tr>
                      <td colSpan={!isReadOnly ? 11 : 10} className="py-6 text-center text-muted-foreground text-xs">
                        No hay insumos base configurados para este ítem
                      </td>
                    </tr>
                  ) : (
                    insumosSeleccionados.map((ins, idx) => (
                      <tr key={idx} className="hover:bg-accent/40 transition-colors text-center">
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{ins.sku}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground text-xs text-left">{ins.nombre}</td>
                        <td className="py-2.5 px-3 text-center">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min={1}
                              value={ins.cantidad}
                              onChange={(e) =>
                                handleActualizarInsumo(idx, 'cantidad', Number(e.target.value))
                              }
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold"
                            />
                          ) : (
                            <span className="font-semibold text-foreground text-xs">{ins.cantidad}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          ${Number(ins.costo_unitario).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(ins.monto_total_linea).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {!isReadOnly ? (
                            <div className="inline-flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                max={99.99}
                                step="any"
                                value={ins.porcentaje_ganancia}
                                onChange={(e) =>
                                  handleActualizarInsumo(
                                    idx,
                                    'porcentaje_ganancia',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 px-1.5 py-1 text-xs text-right rounded border border-border/80 bg-background text-foreground font-mono"
                              />
                              <span className="text-muted-foreground text-xs">%</span>
                            </div>
                          ) : (
                            <span>{Number(ins.porcentaje_ganancia).toFixed(1)}%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {!isReadOnly ? (
                            <div className="inline-flex items-center gap-1 justify-center">
                              <span className="text-muted-foreground text-xs">$</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={ins.costo_unitario_con_ganancia}
                                onChange={(e) =>
                                  handleActualizarInsumo(
                                    idx,
                                    'costo_unitario_con_ganancia',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono"
                              />
                            </div>
                          ) : (
                            <span>
                              ${Number(ins.costo_unitario_con_ganancia).toLocaleString('es-CL', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground">
                          ${Number(ins.monto_total_linea_con_ganancia).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {Number(ins.porcentaje_iva).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(ins.monto_iva).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        {!isReadOnly && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverInsumo(idx)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Remover insumo"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar lateral de Búsqueda por SKU */}
          {!isReadOnly && (
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
                        const disponible = insumosDisponibles.find(
                          (item) =>
                            !insumosSeleccionados.some(
                              (i) => i.id_insumo === item.id_inventario
                            )
                        );
                        if (disponible) {
                          handleAgregarInsumo(disponible);
                        } else if (insumosDisponibles.length > 0) {
                          toast.info('Los ítems encontrados ya están agregados');
                        }
                      }
                    }}
                    placeholder="Filtrar insumo..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {insumosDisponibles.slice(0, 15).map((item) => {
                  const yaSeleccionado = insumosSeleccionados.some(
                    (i) => i.id_insumo === item.id_inventario
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
                        <span className="text-[10px] font-mono text-muted-foreground">
                          SKU: {item.sku}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarInsumo(item)}
                        disabled={yaSeleccionado}
                        className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}
                        title={yaSeleccionado ? 'Ya agregado' : 'Agregar a la lista'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. SECCIÓN SERVICIOS DEL TALLER (Sin columnas estado, fecha inicio ni fecha fin) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Lista de Servicios del Taller Seleccionados
        </h2>

        <div className={`grid grid-cols-1 ${!isReadOnly ? 'lg:grid-cols-12' : ''} gap-4 items-start`}>
          {/* Tabla de Servicios */}
          <div
            className={`${!isReadOnly ? 'lg:col-span-9' : 'w-full'
              } bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
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
                    {!isReadOnly && <th className="py-2.5 px-3 text-center">acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {serviciosSeleccionados.length === 0 ? (
                    <tr>
                      <td colSpan={!isReadOnly ? 10 : 9} className="py-6 text-center text-muted-foreground text-xs">
                        No hay servicios base seleccionados
                      </td>
                    </tr>
                  ) : (
                    serviciosSeleccionados.map((srv, idx) => (
                      <tr key={idx} className="hover:bg-accent/40 transition-colors text-center">
                        <td className="py-2.5 px-3 font-semibold text-foreground text-xs text-left">
                          {srv.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min={1}
                              value={srv.cantidad}
                              onChange={(e) =>
                                handleActualizarServicio(idx, 'cantidad', Number(e.target.value))
                              }
                              className="w-16 px-1.5 py-1 text-xs text-center rounded border border-border/80 bg-background text-foreground font-semibold"
                            />
                          ) : (
                            <span className="font-semibold text-foreground text-xs">{srv.cantidad}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          ${Number(srv.costo_unitario).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(srv.monto_total_linea).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {!isReadOnly ? (
                            <div className="inline-flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min={0}
                                max={99.99}
                                step="any"
                                value={srv.porcentaje_ganancia}
                                onChange={(e) =>
                                  handleActualizarServicio(
                                    idx,
                                    'porcentaje_ganancia',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 px-1.5 py-1 text-xs text-right rounded border border-border/80 bg-background text-foreground font-mono"
                              />
                              <span className="text-muted-foreground text-xs">%</span>
                            </div>
                          ) : (
                            <span>{Number(srv.porcentaje_ganancia).toFixed(1)}%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {!isReadOnly ? (
                            <div className="inline-flex items-center gap-1 justify-center">
                              <span className="text-muted-foreground text-xs">$</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={srv.costo_unitario_con_ganancia}
                                onChange={(e) =>
                                  handleActualizarServicio(
                                    idx,
                                    'costo_unitario_con_ganancia',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 px-1.5 py-1 text-xs rounded border border-border/80 bg-background text-foreground font-mono"
                              />
                            </div>
                          ) : (
                            <span>
                              ${Number(srv.costo_unitario_con_ganancia).toLocaleString('es-CL', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-foreground">
                          ${Number(srv.monto_total_linea_con_ganancia).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          {Number(srv.porcentaje_iva).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                          ${Number(srv.monto_iva).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        {!isReadOnly && (
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoverServicio(idx)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Remover servicio"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar lateral de Búsqueda de Servicios */}
          {!isReadOnly && (
            <div className="lg:col-span-3 bg-card rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground block">Buscar por Nombre</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={busquedaNombreServicio}
                    onChange={(e) => setBusquedaNombreServicio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const disponible = serviciosDisponibles.find(
                          (serv) =>
                            !serviciosSeleccionados.some(
                              (s) => s.id_servicio_taller === serv.id_servicio_taller
                            )
                        );
                        if (disponible) {
                          handleAgregarServicio(disponible);
                        } else if (serviciosDisponibles.length > 0) {
                          toast.info('Los servicios encontrados ya están agregados');
                        }
                      }
                    }}
                    placeholder="Filtrar servicio..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {serviciosDisponibles.slice(0, 15).map((serv) => {
                  const yaSeleccionado = serviciosSeleccionados.some(
                    (s) => s.id_servicio_taller === serv.id_servicio_taller
                  );
                  return (
                    <div
                      key={serv.id_servicio_taller}
                      className="pt-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <span
                          className={`font-semibold block truncate ${yaSeleccionado ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}
                        >
                          {serv.nombre}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Base: ${Number(serv.costo_base || 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarServicio(serv)}
                        disabled={yaSeleccionado}
                        className={`p-1 rounded-lg shrink-0 transition-colors ${yaSeleccionado
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}
                        title={yaSeleccionado ? 'Ya agregado' : 'Agregar a la lista'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. DATA ECONÓMICA DE LA REPARACIÓN BASE */}
      <div className="pt-4 border-t border-border/80 space-y-4">
        {/* Recuadro de Totales Consolidados a ancho completo */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2 text-xs">
          <span className="font-bold text-foreground text-sm block">
            Data Económica de la Reparación Base
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 text-muted-foreground font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                servicios_base:
              </span>
              <strong className="text-foreground text-sm">
                ${totalesEconomicos.costo_servicios_base}
              </strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                insumos_base:
              </span>
              <strong className="text-foreground text-sm">
                ${totalesEconomicos.costo_insumos_base}
              </strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                servicios_con_ganancia:
              </span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                ${totalesEconomicos.costo_servicios_con_ganancia}
              </strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                insumos_con_ganancia:
              </span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                ${totalesEconomicos.costo_insumos_con_ganancia}
              </strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                costo_total:
              </span>
              <strong className="text-foreground text-sm">
                ${totalesEconomicos.costo_total}
              </strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                total_con_ganancia:
              </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                ${totalesEconomicos.costo_total_con_ganancia}
              </strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] block uppercase font-sans tracking-wide">
                monto_total_iva:
              </span>
              <strong className="text-foreground text-sm">
                ${totalesEconomicos.monto_total_iva}
              </strong>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isReadOnly ? (
            <button
              type="button"
              onClick={() => setIsEditingDirecto(true)}
              className="px-6 py-3 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar Reparación Base
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                Cancelar Edición
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={syncMutation.isPending}
                className="px-6 py-3 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {syncMutation.isPending ? 'Guardando...' : 'Guardar Cambios Base'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventarioReparacionBasePage;

