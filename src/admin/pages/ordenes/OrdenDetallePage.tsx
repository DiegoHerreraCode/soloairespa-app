import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ClipboardList,
  User,
  Calendar,
  CreditCard,
  Layers,
  Wrench,
  Phone,
  Mail,
  MapPin,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { getOrdenByIdAction } from '../../actions/get-orden-by-id.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { getPagosClientesAction } from '../../actions/get-pagos-clientes.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { getReparacionesAction } from '../../actions/get-reparaciones.action';
import type { DetalleOrdenItem } from '../../interfaces/orden.interface';
import type { PagoClienteItem } from '../../interfaces/pago-cliente.interface';
import type { InventarioItem } from '../../interfaces/inventario.interface';
import type { RepuestoItem } from '../../interfaces/repuesto.interface';
import type { ReparacionItem } from '../../interfaces/reparacion.interface';

export const OrdenDetallePage = () => {
  const { id } = useParams<{ id: string }>();

  // 1. Consultar la Orden por ID
  const { data: orden, isLoading: isLoadingOrden } = useQuery({
    queryKey: ['orden-item', id],
    queryFn: () => getOrdenByIdAction(id!),
    enabled: !!id,
  });

  // 2. Consultar catálogos para enriquecer la visualización de sólo lectura
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: getClientesAction,
  });

  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-select'],
    queryFn: getTiposOrdenesAction,
  });

  const { data: todosLosPagos = [] } = useQuery({
    queryKey: ['pagos-clientes-listado'],
    queryFn: getPagosClientesAction,
  });

  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
  });

  const { data: repuestos = [] } = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
  });

  const { data: reparaciones = [] } = useQuery({
    queryKey: ['reparaciones-listado'],
    queryFn: getReparacionesAction,
  });

  // Mapas de búsqueda rápida
  const cliente = orden?.cliente || clientes.find((c) => c.id_cliente === orden?.id_cliente);
  const tipoOrden = orden?.tipo_orden || tiposOrdenes.find((t) => t.id_tipo_orden === orden?.id_tipo_orden);
  const tipoNombre = (tipoOrden?.nombre || '').toLowerCase();

  const inventarioMap = new Map<number, InventarioItem>(
    inventario.map((item) => [item.id_inventario, item])
  );
  const repuestosMap = new Map<number, RepuestoItem>(
    repuestos.map((rep) => [rep.id_repuesto, rep])
  );

  // Pagos asociados a esta orden
  const pagosAsociados = todosLosPagos.filter((p: PagoClienteItem) => Number(p.id_orden) === Number(id));

  // Reparaciones asociadas a esta orden (si es orden de reparación)
  const reparacionesAsociadas = reparaciones.filter((r: ReparacionItem) => Number(r.id_orden) === Number(id));

  // Formato monetario
  const formatMoney = (val: string | number | undefined) => {
    return Number(val || 0).toLocaleString('es-CL');
  };

  if (isLoadingOrden) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6 text-center">
        <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Orden no encontrada</h2>
        <p className="text-sm text-muted-foreground">
          No fue posible encontrar la orden identificada con el número #{id}.
        </p>
        <Link
          to="/admin/ordenes/listado"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Listado de Órdenes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn mx-auto pb-16">
      {/* 1. BARRA SUPERIOR: Título + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/ordenes/listado"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-500" />
              Detalle de Orden #{orden.id_orden}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tipo de Orden:{' '}
              <span className="font-semibold capitalize text-foreground">
                {tipoOrden?.nombre || 'General'}
              </span>
            </p>
          </div>
        </div>

        {/* Badges de Estados */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Estado Operativo */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${orden.estado_operativo === 'finalizada'
              ? 'bg-emerald-500/10 text-dark-600 dark:text-dark-400 border border-emerald-500/20'
              : orden.estado_operativo === 'en_proceso'
                ? 'bg-blue-500/10 text-dark-600 dark:text-dark-400 border border-blue-500/20'
                : orden.estado_operativo === 'anulada'
                  ? 'bg-rose-500/10 text-dark-600 dark:text-dark-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-dark-600 dark:text-dark-400 border border-amber-500/20'
              }`}
          >
            Operativo: {orden.estado_operativo?.replace('_', ' ') || 'pendiente'}
          </span>

          {/* Estado Administrativo */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${orden.estado_administrativo === 'pagada'
              ? 'bg-emerald-500/10 text-dark-600 dark:text-dark-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-dark-600 dark:text-dark-400 border border-amber-500/20'
              }`}
          >
            Admin: {orden.estado_administrativo?.replace('_', ' ') || 'pendiente'}
          </span>
        </div>
      </div>

      {/* ALERTA DE ANULACIÓN (Si la orden está anulada) */}
      {orden.estado_operativo === 'anulada' && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Esta orden se encuentra formalmente Anulada
            </h4>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Motivo: </span>
              {orden.motivo_anulacion || 'No especificado'}
            </p>
            {orden.fecha_anulacion && (
              <p className="text-xs text-muted-foreground font-mono">
                Fecha de anulación: {orden.fecha_anulacion}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. TARJETAS SUPERIORES: Datos del Cliente, Fechas y Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tarjeta Cliente */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            <User className="w-4 h-4 text-blue-500" />
            Información del Cliente
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Nombre / Razón: </span>
              <span className="font-bold text-foreground">
                {cliente?.nombre || '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">RUT: </span>
              <span className="font-mono font-semibold text-foreground">
                {cliente?.rut || '-'}
              </span>
            </div>
            {cliente?.correo && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>{cliente.correo}</span>
              </div>
            )}
            {cliente?.num_tlf && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>{cliente.num_tlf}</span>
              </div>
            )}
            {cliente?.direccion && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{cliente.direccion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta Fechas y Tiempos */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Fechas y Plazos
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Fecha de Creación: </span>
              <span className="font-mono font-semibold text-foreground">
                {orden.fecha_creacion ? orden.fecha_creacion.split('T')[0] : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Entrega de Reparación: </span>
              <span className="font-mono font-semibold text-foreground">
                {orden.fecha_entrega_reparacion
                  ? orden.fecha_entrega_reparacion.split('T')[0]
                  : 'N/A (No aplica)'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Última Actualización: </span>
              <span className="font-mono text-muted-foreground text-xs">
                {orden.last_update ? orden.last_update.replace('T', ' ').slice(0, 19) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta Resumen Financiero */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            <CreditCard className="w-4 h-4 text-blue-500" />
            Resumen Financiero
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto Gravado:</span>
              <span className="font-mono font-medium text-foreground">
                ${formatMoney(orden.monto_total_gravado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto Exento:</span>
              <span className="font-mono font-medium text-foreground">
                ${formatMoney(orden.monto_total_exento)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA Total:</span>
              <span className="font-mono font-medium text-foreground">
                ${formatMoney(orden.monto_total_iva)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/60 text-sm">
              <span className="font-bold text-foreground">Total:</span>
              <span className="font-mono font-extrabold text-foreground">
                ${formatMoney(orden.monto_total)}
              </span>
            </div>
            <div className="flex justify-between pt-0.5 text-xs font-semibold">
              <span className="text-rose-500">Monto Pendiente:</span>
              <span className="font-mono text-rose-500">
                ${formatMoney(orden.monto_pendiente)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LÍNEAS DE DETALLE DE LA ORDEN (Productos, Repuestos, Servicios) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Detalles de la Orden
        </h2>

        <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Ítem / Descripción</th>
                  <th className="py-3 px-4 text-center">Cant.</th>
                  <th className="py-3 px-4 text-center">Precio Unit.</th>
                  {tipoNombre === 'recambio' && (
                    <th className="py-3 px-4 text-center">Tasación Entrante</th>
                  )}
                  <th className="py-3 px-4 text-center">Subtotal Neto</th>
                  <th className="py-3 px-4 text-center">IVA %</th>
                  <th className="py-3 px-4 text-center">Monto IVA</th>
                  <th className="py-3 px-4 text-center">Total Línea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {!orden.detalles || orden.detalles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tipoNombre === 'recambio' ? 8 : 7}
                      className="py-8 text-center text-muted-foreground text-xs"
                    >
                      Esta orden no posee líneas de productos o repuestos directos (habitual en órdenes de taller donde el costo proviene de la reparación asociada).
                    </td>
                  </tr>
                ) : (
                  orden.detalles.map((det: DetalleOrdenItem, idx: number) => {
                    // Resolver nombre del ítem saliente
                    const itemInsumo = det.id_inventario_insumo_saliente
                      ? inventarioMap.get(det.id_inventario_insumo_saliente)
                      : null;
                    const itemRepuestoSaliente = det.id_inventario_repuesto_saliente
                      ? inventarioMap.get(det.id_inventario_repuesto_saliente)
                      : null;
                    const repSalienteFisico = det.id_repuesto_saliente
                      ? repuestosMap.get(det.id_repuesto_saliente)
                      : null;

                    // Para recambio: ítem entrante
                    const itemRepuestoEntrante = det.id_inventario_repuesto_entrante
                      ? inventarioMap.get(det.id_inventario_repuesto_entrante)
                      : null;
                    const repEntranteFisico = det.id_repuesto_entrante
                      ? repuestosMap.get(det.id_repuesto_entrante)
                      : null;

                    const nombreSaliente =
                      det.insumo_saliente?.nombre ||
                      itemInsumo?.nombre ||
                      det.repuesto_saliente_inventario?.nombre ||
                      itemRepuestoSaliente?.nombre ||
                      `Ítem de Detalle #${idx + 1}`;

                    const skuSaliente =
                      det.insumo_saliente?.sku ||
                      itemInsumo?.sku ||
                      det.repuesto_saliente_inventario?.sku ||
                      itemRepuestoSaliente?.sku;

                    return (
                      <tr key={det.id_detalle_orden || idx} className="hover:bg-accent/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{nombreSaliente}</div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {skuSaliente && <span className="font-mono">SKU: {skuSaliente}</span>}
                            {repSalienteFisico?.serial && (
                              <span className="font-mono">Serial: {repSalienteFisico.serial}</span>
                            )}
                            {repSalienteFisico?.service_tag && (
                              <span className="font-mono">Service Tag: {repSalienteFisico.service_tag}</span>
                            )}
                          </div>
                          {tipoNombre === 'recambio' && (itemRepuestoEntrante || repEntranteFisico) && (
                            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">
                              Recibe a cambio:{' '}
                              <span className="font-semibold">
                                {itemRepuestoEntrante?.nombre || 'Pieza tasada del cliente'}
                              </span>
                              <br />
                              {repEntranteFisico?.serial && (
                                <span className="font-mono">Serial: {repEntranteFisico.serial}</span>
                              )}
                              <br />
                              {repEntranteFisico?.service_tag && (
                                <span className="font-mono">Service Tag: {repEntranteFisico.service_tag}</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-foreground">
                          {det.cantidad}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-foreground">
                          ${formatMoney(det.precio_unitario)}
                        </td>

                        {tipoNombre === 'recambio' && (
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            -${formatMoney(det.monto_tasacion)}
                          </td>
                        )}

                        <td className="py-3 px-4 text-right font-mono text-foreground font-medium">
                          ${formatMoney(det.monto_total_linea_sin_iva)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {det.porcentaje_iva ?? 19}%
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          ${formatMoney(det.monto_iva)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          ${formatMoney(det.monto_total_linea_con_iva)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN SI ES ORDEN DE REPARACIÓN: Reparaciones y Servicios de Taller */}
      {reparacionesAsociadas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" />
            Reparaciones de Taller Vinculadas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reparacionesAsociadas.map((rep: ReparacionItem) => {
              const repuestoObj = rep.repuesto || repuestosMap.get(rep.id_repuesto);
              const invRepuesto = repuestoObj?.id_inventario
                ? inventarioMap.get(repuestoObj.id_inventario)
                : null;

              return (
                <div
                  key={rep.id_reparacion}
                  className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-blue-500" />
                      Reparación #{rep.id_reparacion}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${rep.estado === 'finalizada'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : rep.estado === 'anulada'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                    >
                      {rep.estado}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-muted-foreground">Equipo / Repuesto: </span>
                      <span className="font-semibold text-foreground">
                        {invRepuesto?.nombre || `Repuesto #${rep.id_repuesto}`}
                      </span>
                    </div>
                    {repuestoObj?.service_tag && (
                      <div>
                        <span className="text-muted-foreground">Service Tag: </span>
                        <span className="font-mono text-foreground font-semibold">
                          {repuestoObj.service_tag}
                        </span>
                      </div>
                    )}
                    {repuestoObj?.serial && (
                      <div>
                        <span className="text-muted-foreground">Serial: </span>
                        <span className="font-mono text-muted-foreground">
                          {repuestoObj.serial}
                        </span>
                      </div>
                    )}
                    <div className="pt-1 flex justify-between font-mono font-semibold text-foreground">
                      <span>Costo Total Reparación:</span>
                      <span>${formatMoney(rep.costo_total_con_ganancia || rep.costo_total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. HISTORIAL DE PAGOS DE CLIENTE ASOCIADOS */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          Pagos Registrados a esta Orden
        </h2>

        <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-center">ID Pago</th>
                  <th className="py-3 px-4 text-center">Fecha Pago</th>
                  <th className="py-3 px-4 text-center">Método</th>
                  <th className="py-3 px-4 text-center">N° Comprobante</th>
                  <th className="py-3 px-4 text-center">Monto Pagado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagosAsociados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                      No se registran pagos asociados para esta orden aún.
                    </td>
                  </tr>
                ) : (
                  pagosAsociados.map((pago: PagoClienteItem) => (
                    <tr key={pago.id_pago_cliente} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        #{pago.id_pago_cliente}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {pago.fecha_pago ? pago.fecha_pago.split('T')[0] : '-'}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-foreground">
                        {pago.metodo_pago?.replace('_', ' ') || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {pago.num_referencia || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${formatMoney(pago.monto)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${pago.estado === 'completado'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : pago.estado === 'anulado'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                        >
                          {pago.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenDetallePage;
