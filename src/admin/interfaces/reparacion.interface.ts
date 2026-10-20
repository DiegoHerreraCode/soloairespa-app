import type { RepuestoItem } from './repuesto.interface';
import type { OrdenItem } from './orden.interface';
import type { AdminItem } from './admin.interface';
import type { InventarioItem } from './inventario.interface';
import type { ServicioTallerItem } from './servicio-taller.interface';

export interface ReparacionInsumoItem {
  id_reparacion_insumo?: number;
  id_reparacion: number;
  id_inventario: number;
  id_admin?: number;
  cantidad: number;
  costo_unitario: number | string;
  monto_total_linea: number | string;
  costo_unitario_con_ganancia: number | string;
  monto_total_linea_con_ganancia: number | string;
  porcentaje_iva: number | string;
  monto_iva: number | string;
  inventario?: InventarioItem;
}

export interface ReparacionServicioTallerItem {
  id_reparacion_servicio_taller?: number;
  id_reparacion: number;
  id_servicio_taller: number;
  id_admin?: number;
  cantidad: number;
  costo_unitario: number | string;
  monto_total_linea: number | string;
  costo_unitario_con_ganancia: number | string;
  monto_total_linea_con_ganancia: number | string;
  porcentaje_iva: number | string;
  monto_iva: number | string;
  estado: 'pendiente_asignacion' | 'en_espera' | 'en_proceso' | 'finalizado' | 'anulado';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  servicio_taller?: ServicioTallerItem;
  asignaciones?: any[];
}

export interface ReparacionItem {
  id_reparacion: number;
  id_repuesto: number;
  id_orden?: number | null;
  estado: 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';
  fecha_inicio?: string | null;
  id_admin_fecha_inicio?: number | null;
  fecha_fin?: string | null;
  id_admin_fecha_fin?: number | null;
  costo_servicios_base?: number | string;
  costo_insumos_base?: number | string;
  costo_servicios_con_ganancia?: number | string;
  costo_insumos_con_ganancia?: number | string;
  costo_total?: number | string;
  costo_total_con_ganancia?: number | string;
  monto_total_iva?: number | string;
  repuesto?: RepuestoItem;
  orden?: OrdenItem;
  admin_inicio?: AdminItem;
  admin_fin?: AdminItem;
  insumos?: ReparacionInsumoItem[];
  servicios_taller?: ReparacionServicioTallerItem[];
}
