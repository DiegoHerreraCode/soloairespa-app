import {
  ClipboardList,
  AlertTriangle,
  Wrench,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { MonthlyOrdersBarChart } from '../../components/dashboard/MonthlyOrdersBarChart';
import { OrderStatusPieChart } from '../../components/dashboard/OrderStatusPieChart';
import { DashboardCalendar } from '../../components/dashboard/DashboardCalendar';
import { RecentOrdersTable } from '../../components/dashboard/RecentOrdersTable';
import { QuickActionsTable } from '../../components/dashboard/QuickActionsTable';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const { ordenes, inventario, repuestos, pagosCompras, isLoading, refetchAll } = useDashboardData();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Métrica: Órdenes creadas en el mes actual
  const ordenesMesActual = ordenes.filter((ord) => {
    if (!ord.fecha_creacion) return false;
    const d = new Date(ord.fecha_creacion);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // 2. Métrica: Num ítems de inventario bajo stock_minimo (cantidad_propia < stock_minimo)
  const itemsBajoStock = inventario.filter((item) => {
    const stockPropio = Number(item.cantidad_propia || 0);
    const stockMin = Number(item.stock_minimo || 0);
    return stockPropio < stockMin;
  }).length;

  // 3. Métrica: Num repuestos pendientes de reparación
  const repuestosPendientesReparacion = repuestos.filter(
    (rep) => rep.estado === 'pendiente_reparacion' && rep.id_orden_salida === null
  ).length;

  // 4. Métrica: Num pagos pendientes a proveedores
  const pagosPendientesProveedores = pagosCompras.filter(
    (p) => p.estado === 'pendiente'
  ).length;

  // 5. Gráfico de barras: Volumen mensual de órdenes (últimos 6 meses)
  const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const mIndex = d.getMonth();
    const yVal = d.getFullYear();

    const count = ordenes.filter((ord) => {
      if (!ord.fecha_creacion) return false;
      const od = new Date(ord.fecha_creacion);
      return od.getMonth() === mIndex && od.getFullYear() === yVal;
    }).length;

    monthlyData.push({
      month: monthLabels[mIndex],
      total: count,
    });
  }

  // 6. Gráfica de pastel: Distribución por estados operativos de órdenes
  const pieData = {
    en_espera: ordenes.filter((o) => o.estado_operativo === 'en_espera').length,
    en_proceso: ordenes.filter((o) => o.estado_operativo === 'en_proceso').length,
    finalizada: ordenes.filter((o) => o.estado_operativo === 'finalizada').length,
    anulada: ordenes.filter((o) => o.estado_operativo === 'anulada').length,
  };

  // 7. Calendario 1: Fechas de pagos pendientes a proveedores (fecha_pago_acordada)
  const fechasPagosProveedores = pagosCompras
    .filter((p) => p.estado === 'pendiente' && p.fecha_pago_acordada)
    .map((p) => p.fecha_pago_acordada as string);

  // 8. Calendario 2: Fechas de entrega de reparación (fecha_entrega_reparacion)
  const fechasEntregaReparacion = ordenes
    .filter((o) => o.fecha_entrega_reparacion && o.estado_operativo !== 'finalizada' && o.estado_operativo !== 'anulada')
    .map((o) => o.fecha_entrega_reparacion as string);

  return (
    <div className="space-y-8 pb-10">
      {/* Título superior y botón de refresco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Panel Principal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard Operativo
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitoreo en tiempo real de operaciones, inventarios y compromisos de SoloAireSPA
          </p>
        </div>

        <Button
          onClick={refetchAll}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl shadow-xs"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'Actualizando...' : 'Actualizar Datos'}</span>
        </Button>
      </div>

      {/* FILA 1: Cards con métricas relevantes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Órdenes Creadas"
          value={ordenesMesActual}
          subtitle="En el mes actual"
          icon={ClipboardList}
          color="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
        />

        <MetricCard
          title="Inventario Bajo Stock"
          value={itemsBajoStock}
          subtitle="cantidad_propia < stock_minimo"
          icon={AlertTriangle}
          color="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
        />

        <MetricCard
          title="Repuestos en Espera"
          value={repuestosPendientesReparacion}
          subtitle="Pendientes de reparación"
          icon={Wrench}
          color="bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20"
        />

        <MetricCard
          title="Pagos a Proveedores"
          value={pagosPendientesProveedores}
          subtitle="Pendientes por liquidar"
          icon={CreditCard}
          color="bg-rose-500/10 text-rose-500 dark:bg-rose-500/20"
        />
      </section>

      {/* FILA 2: Gráficas (Barras y Pastel) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyOrdersBarChart
          title="Volumen Mensual de Órdenes"
          data={monthlyData}
        />

        <OrderStatusPieChart
          title="Distribución de Estados Operativos"
          data={pieData}
        />
      </section>

      {/* FILA 3: Calendarios Interactivos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCalendar
          title="Calendario de Pagos Pendientes a Proveedores"
          subtitle="Compromisos de pago acordados con proveedores"
          highlightedDates={fechasPagosProveedores}
          tooltipMessage="Pago acordado a proveedor programado para esta fecha"
        />

        <DashboardCalendar
          title="Calendario de Fechas de Entrega de Reparación"
          subtitle="Entregas comprometidas de órdenes de reparación"
          highlightedDates={fechasEntregaReparacion}
          tooltipMessage="Entrega de repuesto o servicio de reparación agendada"
        />
      </section>

      {/* FILA 4: Tabla de últimas órdenes y Accesos Rápidos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable ordenes={ordenes} />
        <QuickActionsTable />
      </section>
    </div>
  );
};

export default DashboardPage;
