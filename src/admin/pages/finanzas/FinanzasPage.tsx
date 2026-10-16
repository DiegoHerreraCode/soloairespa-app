import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  CircleDollarSign,
  Calendar as CalendarIcon,
  RefreshCw,
} from 'lucide-react';
import { useFinanzasData } from '../../hooks/useFinanzasData';
import { FinanceSummaryCard } from '../../components/finanzas/FinanceSummaryCard';
import { BusinessLinesBreakdown, type BusinessLineData } from '../../components/finanzas/BusinessLinesBreakdown';
import { InventoryAndTopProducts } from '../../components/finanzas/InventoryAndTopProducts';
import { Button } from '@/components/ui/button';

export const FinanzasPage = () => {
  const { ordenes, inventario, repuestos, pagosCompras, pagosClientes, tiposOrdenes, reparaciones, isLoading, refetchAll } = useFinanzasData();

  // Estados para filtro de fechas (Desde / Hasta)
  const now = new Date();
  const defaultDesde = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; // 1 de enero
  const defaultHasta = now.toISOString().split('T')[0]; // Hoy

  const [fechaDesde, setFechaDesde] = useState<string>(defaultDesde);
  const [fechaHasta, setFechaHasta] = useState<string>(defaultHasta);

  // Mapear tipos_ordenes por ID a su nombre normalizado
  const tiposMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((t) => {
      map.set(t.id_tipo_orden, (t.nombre || '').toLowerCase().trim());
    });
    return map;
  }, [tiposOrdenes]);

  // Mapear órdenes por ID para consultas rápidas
  const ordenesMap = useMemo(() => {
    const map = new Map<number, (typeof ordenes)[0]>();
    ordenes.forEach((o) => map.set(o.id_orden, o));
    return map;
  }, [ordenes]);

  // Mapear inventario por ID
  const inventarioMap = useMemo(() => {
    const map = new Map<number, (typeof inventario)[0]>();
    inventario.forEach((i) => map.set(i.id_inventario, i));
    return map;
  }, [inventario]);

  // Filtrado por rango de fechas
  const isInRange = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.split('T')[0].split(' ')[0];
    return cleanDate >= fechaDesde && cleanDate <= fechaHasta;
  };

  // 1. INGRESOS TOTALES: pagos registrados por los clientes no anulados en el rango
  const pagosClientesFiltrados = useMemo(() => {
    return pagosClientes.filter(
      (p) => p.estado !== 'anulado' && isInRange(p.fecha_pago)
    );
  }, [pagosClientes, fechaDesde, fechaHasta]);

  const ingresosTotales = useMemo(() => {
    return pagosClientesFiltrados.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  }, [pagosClientesFiltrados]);

  // 2. EGRESOS TOTALES:
  //    - Pagos a compras a proveedores registrados y en estado 'realizado' en el rango
  //    - + costo_total de cada repuesto con id_detalle_compra = null
  //      cuya orden de entrada tenga estado_operativo != 'anulada'
  //      y fecha_creacion de dicha orden esté dentro del rango
  const pagosComprasRealizados = useMemo(() => {
    return pagosCompras.filter(
      (p) => p.estado === 'realizado' && isInRange(p.fecha_pago)
    );
  }, [pagosCompras, fechaDesde, fechaHasta]);

  const sumatoriaPagosCompras = useMemo(() => {
    return pagosComprasRealizados.reduce(
      (sum, p) => sum + Number(p.monto_a_pagar || 0),
      0
    );
  }, [pagosComprasRealizados]);

  // Mapear repuestos por ID
  const repuestosMap = useMemo(() => {
    const map = new Map<number, (typeof repuestos)[0]>();
    repuestos.forEach((r) => map.set(r.id_repuesto, r));
    return map;
  }, [repuestos]);

  // Egresos por recambios: costo_adquisicion de repuestos con id_detalle_compra = null
  // que entraron por orden de recambio (id_tipo_orden = 3) no anulada
  const repuestosRecambioValidos = useMemo(() => {
    return repuestos.filter((r) => {
      // Excluir repuestos provenientes de compras a proveedores
      if (r.id_detalle_compra !== null && r.id_detalle_compra !== undefined) return false;

      if (!r.id_orden_entrada) return false;
      const ordenEntrada = ordenesMap.get(r.id_orden_entrada);
      if (!ordenEntrada) return false;

      // Orden de tipo recambio (id_tipo_orden = 3)
      if (Number(ordenEntrada.id_tipo_orden) !== 3) return false;

      // Estado operativo no anulada
      if (ordenEntrada.estado_operativo === 'anulada') return false;

      // En el rango de fechas
      return isInRange(ordenEntrada.fecha_creacion);
    });
  }, [repuestos, ordenesMap, fechaDesde, fechaHasta]);

  const egresosPorRecambios = useMemo(() => {
    return repuestosRecambioValidos.reduce(
      (sum, r) => sum + Number(r.costo_adquisicion || 0),
      0
    );
  }, [repuestosRecambioValidos]);

  // Costos de taller (reparaciones finalizadas con fecha_fin en el período)
  // Se excluyen aquellas cuyo repuesto tenga id_detalle_compra != null
  const egresosTaller = useMemo(() => {
    return reparaciones
      .filter((r) => {
        if (!isInRange(r.fecha_fin) || r.estado !== 'finalizada') return false;
        const repuesto = repuestosMap.get(r.id_repuesto);
        // Excluir repuestos provenientes de compra
        if (repuesto && repuesto.id_detalle_compra !== null && repuesto.id_detalle_compra !== undefined) {
          return false;
        }
        return true;
      })
      .reduce((sum, r) => sum + Number(r.costo_total || 0), 0);
  }, [reparaciones, repuestosMap, fechaDesde, fechaHasta]);

  // 2. EGRESOS TOTALES = Compras a Proveedores + Egresos por Recambios + Costos de Reparaciones de Taller
  // Garantiza 100% de coherencia matemática con el Desglose por Línea de Operación
  const egresosTotales = sumatoriaPagosCompras + egresosPorRecambios + egresosTaller;

  // 3. MARGEN OPERATIVO = Ingresos Totales - Egresos Totales
  const margenOperativoMonto = ingresosTotales - egresosTotales;
  const margenOperativoPorcentaje =
    ingresosTotales > 0
      ? ((margenOperativoMonto / ingresosTotales) * 100).toFixed(2)
      : '0.0';

  // 4. IVA ACUMULADO (PERÍODO) =
  //    monto_total_iva (ordenes con estado_administrativo = 'pagada' en el rango)
  //    - sumatoria abono_al_iva (pagos_compras con estado 'realizado' en el rango)
  const ordenesPagadas = useMemo(() => {
    return ordenes.filter(
      (o) =>
        o.estado_administrativo === 'pagada' &&
        o.estado_operativo !== 'anulada' &&
        isInRange(o.fecha_creacion)
    );
  }, [ordenes, fechaDesde, fechaHasta]);

  const ivaVentas = useMemo(() => {
    return ordenesPagadas.reduce(
      (sum, o) => sum + Number(o.monto_total_iva || 0),
      0
    );
  }, [ordenesPagadas]);

  const ivaCompras = useMemo(() => {
    return pagosComprasRealizados.reduce(
      (sum, p) => sum + Number(p.abono_al_iva || 0),
      0
    );
  }, [pagosComprasRealizados]);

  const ivaAcumulado = ivaVentas - ivaCompras;



  // 5. DESGLOSE SEGMENTADO POR LÍNEA DE OPERACIÓN
  const businessLines: BusinessLineData[] = useMemo(() => {
    let ingVentas = 0;
    let ingRecambios = 0;
    let ingReparaciones = 0;

    pagosClientesFiltrados.forEach((pago) => {
      const orden = ordenesMap.get(pago.id_orden);
      const tipo = orden?.id_tipo_orden ? tiposMap.get(orden.id_tipo_orden) : '';

      if (tipo?.includes('venta')) {
        ingVentas += Number(pago.monto || 0);
      } else if (tipo?.includes('recambio')) {
        ingRecambios += Number(pago.monto || 0);
      } else if (tipo?.includes('reparacion')) {
        ingReparaciones += Number(pago.monto || 0);
      } else {
        ingVentas += Number(pago.monto || 0);
      }
    });

    return [
      {
        number: 1,
        title: 'Ventas Directas',
        subtitle: 'Facturación directa de repuestos e insumos',
        ingresos: ingVentas,
      },
      {
        number: 2,
        title: 'Reparaciones de Taller',
        subtitle: 'Mano de obra técnica facturada vs insumos y horas de mecánicos',
        ingresos: ingReparaciones,
        egresos: egresosTaller,
      },
      {
        number: 3,
        title: 'Recambios de Repuestos',
        subtitle: 'Cobro diferencial al cliente vs costo de adquisición del repuesto recibido',
        ingresos: ingRecambios,
        egresos: egresosPorRecambios,
      },
      {
        number: 4,
        title: 'Compras a Proveedores (Abastecimiento)',
        subtitle: `${pagosComprasRealizados.length} pagos liquidados en el período seleccionado`,
        ingresos: 0,
        egresos: sumatoriaPagosCompras,
      },
    ];
  }, [
    pagosClientesFiltrados,
    ordenesMap,
    tiposMap,
    egresosTaller,
    egresosPorRecambios,
    sumatoriaPagosCompras,
    pagosComprasRealizados.length,
  ]);

  // 6. VALOR TOTAL DEL INVENTARIO
  const totalInventoryValue = useMemo(() => {
    return inventario.reduce((sum, item) => {
      const monto_venta_unitario = Number(item.monto_venta_unitario || 0);
      const cant = Number(item.cantidad_total || 0);
      return sum + monto_venta_unitario * cant;
    }, 0);
  }, [inventario]);

  const totalInventoryUnits = useMemo(() => {
    return inventario.reduce((sum, item) => sum + Number(item.cantidad_total || 0), 0);
  }, [inventario]);

  // 7. PRODUCTOS O ITEMS DE INVENTARIO TOP DEL NEGOCIO:
  //    (Insumo, compresor y válvula más vendidos)
  //    A partir de la tabla detalles_ordenes usando:
  //    - id_inventario_insumo_saliente o id_inventario_repuesto_saliente
  //    - cantidad
  //    - en órdenes con estado_operativo != 'anulada'
  const { topInsumo, topCompresor, topValvula } = useMemo(() => {
    // Mapa: id_inventario -> cantidad total vendida
    const salesMap = new Map<number, number>();

    ordenes.forEach((ord) => {
      if (ord.estado_operativo === 'anulada') return;

      const detalles = ord.detalles || [];
      detalles.forEach((det) => {
        const idInv = det.id_inventario_insumo_saliente || det.id_inventario_repuesto_saliente;
        const cant = Number(det.cantidad || 0);
        if (idInv && cant > 0) {
          salesMap.set(idInv, (salesMap.get(idInv) || 0) + cant);
        }
      });
    });

    let bestInsumo: { nombre: string; unidades: number } | undefined = undefined;
    let bestCompresor: { nombre: string; unidades: number } | undefined = undefined;
    let bestValvula: { nombre: string; unidades: number } | undefined = undefined;

    salesMap.forEach((unidades, idInv) => {
      const item = inventarioMap.get(idInv);
      if (!item) return;

      if (item.tipo === 'insumo') {
        if (!bestInsumo || unidades > bestInsumo.unidades) {
          bestInsumo = { nombre: item.nombre, unidades };
        }
      } else if (item.tipo === 'compresor') {
        if (!bestCompresor || unidades > bestCompresor.unidades) {
          bestCompresor = { nombre: item.nombre, unidades };
        }
      } else if (item.tipo === 'valvula') {
        if (!bestValvula || unidades > bestValvula.unidades) {
          bestValvula = { nombre: item.nombre, unidades };
        }
      }
    });

    return {
      topInsumo: bestInsumo,
      topCompresor: bestCompresor,
      topValvula: bestValvula,
    };
  }, [ordenes, inventarioMap]);

  return (
    <div className="space-y-8 pb-10">
      {/* Encabezado Superior con Selector de Fechas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Supervisión Financiera
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Análisis Financiero y Rentabilidad del Negocio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Supervisión integral de rentabilidad, desglose por línea de negocio, cálculo de IVA diferencial y productos más exitosos.
          </p>
        </div>

        {/* Controles de Filtro de Fechas Desde / Hasta */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto bg-card p-2 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2">
            <CalendarIcon size={14} className="text-primary" />
            <span>Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-muted/40 text-foreground font-mono text-xs px-2 py-1 rounded-lg border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2">
            <span>Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-muted/40 text-foreground font-mono text-xs px-2 py-1 rounded-lg border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            onClick={refetchAll}
            variant="ghost"
            size="icon"
            disabled={isLoading}
            className="h-8 w-8 rounded-lg"
            title="Refrescar datos"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* FILA 1: Cards Métricas Principales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <FinanceSummaryCard
          title="Ingresos Totales"
          value={`$${Math.round(ingresosTotales).toLocaleString('es-CL')}`}
          subtitle={`${pagosClientesFiltrados.length} operaciones en el período`}
          icon={TrendingUp}
          badgeColor="bg-emerald-500/10 text-emerald-500"
        />

        <FinanceSummaryCard
          title="Egresos Totales"
          value={`$${Math.round(egresosTotales).toLocaleString('es-CL')}`}
          subtitle="Compras a proveedores y costos taller"
          icon={TrendingDown}
          badgeColor="bg-rose-500/10 text-rose-500"
        />

        <FinanceSummaryCard
          title="Margen Operativo"
          value={`${margenOperativoPorcentaje}%`}
          subtitle={
            margenOperativoMonto >= 0
              ? 'Balance operativo positivo'
              : 'Balance en pérdida o inversión'
          }
          badgeText={`$${Math.round(Math.abs(margenOperativoMonto)).toLocaleString('es-CL')} ${margenOperativoMonto >= 0 ? 'utilidad' : 'déficit'
            }`}
          icon={Percent}
          badgeColor="bg-blue-500/10 text-blue-500"
        />

        <FinanceSummaryCard
          title="IVA Acumulado (Período)"
          value={`$${Math.round(ivaAcumulado).toLocaleString('es-CL')}`}
          subtitle={`IVA Recaudado ($${Math.round(ivaVentas).toLocaleString('es-CL')}) - IVA Pagado ($${Math.round(ivaCompras).toLocaleString('es-CL')})`}
          icon={CircleDollarSign}
          badgeColor="bg-purple-500/10 text-purple-500"
        />
      </section>

      {/* FILA 2: Desglose Segmentado (Izquierda) + Inventario & Productos Top (Derecha) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BusinessLinesBreakdown lines={businessLines} />
        </div>

        <div className="lg:col-span-1">
          <InventoryAndTopProducts
            totalInventoryValue={totalInventoryValue}
            totalInventoryUnits={totalInventoryUnits}
            topInsumo={topInsumo}
            topCompresor={topCompresor}
            topValvula={topValvula}
          />
        </div>
      </section>
    </div>
  );
};

export default FinanzasPage;
