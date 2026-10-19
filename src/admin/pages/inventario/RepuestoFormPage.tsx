import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Wrench,
  Boxes,
  Barcode,
  DollarSign,
  ShieldCheck,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { getRepuestoByIdAction } from '../../actions/get-repuesto-by-id.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import { getComprasAction } from '../../actions/get-compras.action';
import { getOrdenesAction } from '../../actions/get-ordenes.action';

export const RepuestoFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // 1. Consulta del repuesto (solo lectura)
  const { data: repuesto, isLoading: isLoadingRepuesto } = useQuery({
    queryKey: ['repuesto-item', id],
    queryFn: () => getRepuestoByIdAction(id!),
    enabled: !!id,
  });

  // 2. Consulta del inventario para resolver datos del ítem padre
  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
  });

  // 3. Consulta de compras para resolver el id_compra a partir de id_detalle_compra
  const { data: compras = [] } = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
  });

  // 4. Consulta de órdenes para verificar el estado de la orden de entrada
  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
  });

  if (isLoadingRepuesto) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!repuesto) {
    return (
      <div className="bg-card p-12 rounded-2xl border border-border/80 text-center space-y-4 max-w-lg mx-auto">
        <Wrench className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Repuesto no encontrado</h2>
        <p className="text-xs text-muted-foreground">
          No existe ningún registro de repuesto con el identificador #{id}.
        </p>
        <Link
          to="/admin/inventario/repuestos"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </Link>
      </div>
    );
  }

  const itemInv = inventario.find((inv) => inv.id_inventario === repuesto.id_inventario);
  const isTaller = repuesto.propietario === true || String(repuesto.propietario) === '1';

  // Buscar la compra a la que pertenece este detalle de compra
  const compraAsociada = repuesto.id_detalle_compra
    ? compras.find((c) => c.detalles?.some((d) => d.id_detalle_compra === repuesto.id_detalle_compra))
    : null;

  // Buscar la orden de entrada y verificar si su estado operativo es 'anulada'
  const ordenEntrada = repuesto.id_orden_entrada
    ? ordenes.find((o) => o.id_orden === repuesto.id_orden_entrada)
    : null;
  const isOrdenEntradaAnulada = ordenEntrada?.estado_operativo === 'anulada';

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver y Badges de Estado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario/repuestos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-500" />
              Detalle del Repuesto #{repuesto.id_repuesto}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ficha técnica y trazabilidad de la pieza física serializada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de Estado */}
          {repuesto.estado === 'nuevo' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nuevo
            </span>
          ) : repuesto.estado === 'reparado' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Clock className="w-3.5 h-3.5" />
              Reparado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Pendiente Reparación
            </span>
          )}

          {/* Badge de Propietario */}
          {isTaller ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Propiedad del Taller
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
              <User className="w-3.5 h-3.5" />
              Propiedad de Cliente
            </span>
          )}
        </div>
      </div>

      {/* 2. Tarjeta: Información del Ítem de Inventario Maestro */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Boxes className="w-4 h-4 text-blue-500" />
          Ítem de Inventario Asociado
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div className="p-3 bg-accent/40 rounded-xl sm:col-span-2">
            <span className="text-xs text-muted-foreground block">Nombre del Ítem</span>
            <span className="text-base font-bold text-foreground">
              {itemInv?.nombre || `Ítem #${repuesto.id_inventario}`}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">SKU</span>
            <span className="text-base font-bold font-mono text-foreground">
              {itemInv?.sku || 'N/A'}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Tipo</span>
            <span className="text-base font-bold capitalize text-foreground">
              {itemInv?.tipo || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tarjeta: Identificadores Serializados */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Barcode className="w-4 h-4 text-blue-500" />
          Identificadores Físicos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 bg-accent/40 rounded-xl space-y-1">
            <span className="text-xs text-muted-foreground block">Número de Serial</span>
            <span className="text-lg font-bold font-mono text-foreground">
              {repuesto.serial || 'Sin serial'}
            </span>
          </div>

          <div className="p-4 bg-accent/40 rounded-xl space-y-1">
            <span className="text-xs text-muted-foreground block">Service Tag</span>
            <span className="text-sm font-bold font-mono text-foreground break-all">
              {repuesto.service_tag || 'Sin service tag'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tarjeta: Costos y Métricas Económicas */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-500" />
          Costos y Valores Económicos
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">Costo Adquisición</span>
            <span className="text-sm font-bold text-foreground">
              ${Number(repuesto.costo_adquisicion || 0).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">Costo Reparación Base</span>
            <span className="text-sm font-bold text-foreground">
              ${Number(repuesto.costo_reparacion_base || 0).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">Costo Total</span>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
              ${Number(repuesto.costo_total || 0).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">Reparación con Ganancia</span>
            <span className="text-sm font-bold text-foreground">
              ${Number(repuesto.costo_reparacion_con_ganancia || 0).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">Venta Real</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ${Number(repuesto.monto_venta_real || 0).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">Utilidad</span>
            <span className="text-sm font-bold text-foreground">
              ${Number(repuesto.utilidad || 0).toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Tarjeta: Trazabilidad Operativa y Órdenes */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Trazabilidad y Órdenes
          </h3>
          {isOrdenEntradaAnulada && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Orden de Entrada Anulada
            </span>
          )}
        </div>

        {/* Alerta si la orden de entrada está anulada */}
        {isOrdenEntradaAnulada && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-rose-600 dark:text-rose-400">
                Atención: La orden de entrada #{repuesto.id_orden_entrada} se encuentra anulada
              </p>
              <p className="text-muted-foreground">
                El estado operativo de la orden asociada fue anulado, por lo que este movimiento de ingreso quedó invalidado en los registros del sistema.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          {/* id_compra en lugar de id_detalle_compra */}
          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Compra</span>
            <div className="mt-0.5">
              {compraAsociada ? (
                <div className="flex flex-wrap items-center gap-1.5 font-bold text-foreground">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  <span>Compra #{compraAsociada.id_compra}</span>
                  {compraAsociada.num_factura_boleta && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      (Doc: {compraAsociada.num_factura_boleta})
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    Asociada a detalle #{repuesto.id_detalle_compra}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">No aplica</span>
              )}
            </div>
          </div>

          {/* Orden de Entrada con indicativo si está anulada */}
          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Orden de Entrada</span>
            <div className="mt-0.5">
              {repuesto.id_orden_entrada ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-sm font-bold ${isOrdenEntradaAnulada ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    Orden #{repuesto.id_orden_entrada}
                  </span>
                  {isOrdenEntradaAnulada ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-3 h-3" />
                      Anulada
                    </span>
                  ) : ordenEntrada ? (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      ({ordenEntrada.estado_operativo})
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">Ingreso por compra nueva</span>
              )}
            </div>
          </div>

          {/* Orden de Salida */}
          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Orden de Salida</span>
            <span className="text-sm font-bold text-foreground block mt-0.5">
              {repuesto.id_orden_salida ? `Orden #${repuesto.id_orden_salida}` : 'En existencias (Sin salida)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepuestoFormPage;
