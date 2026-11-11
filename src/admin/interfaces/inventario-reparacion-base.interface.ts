import type { InventarioItem } from './inventario.interface';
import type { ServicioTallerItem } from './servicio-taller.interface';

export interface InventarioReparacionInsumoBase {
  id_inventario_reparacion_insumo?: number;
  id_inventario?: number;
  id_insumo?: number;
  id_inventario_insumo?: number;
  sku?: string;
  nombre?: string;
  cantidad: number;
  costo_unitario?: number | string;
  costo_unitario_con_ganancia?: number | string;
  porcentaje_ganancia?: number | string;
  porcentaje_iva?: number | string;
  monto_total_linea?: number | string;
  monto_total_linea_con_ganancia?: number | string;
  monto_iva?: number | string;
  monto_venta_unitario?: number | string;
  subtotal?: number | string;
  insumo?: InventarioItem;
}

export interface InventarioReparacionServicioBase {
  id_inventario_reparacion_servicio?: number;
  id_inventario?: number;
  id_servicio_taller: number;
  nombre?: string;
  cantidad: number;
  costo_unitario?: number | string;
  costo_unitario_con_ganancia?: number | string;
  porcentaje_ganancia?: number | string;
  porcentaje_iva?: number | string;
  monto_total_linea?: number | string;
  monto_total_linea_con_ganancia?: number | string;
  monto_iva?: number | string;
  monto_venta_unitario?: number | string;
  subtotal?: number | string;
  servicio_taller?: ServicioTallerItem;
}

export interface InventarioReparacionBaseResponse {
  id_inventario: number;
  nombre?: string;
  monto_venta_reparacion_base: number;
  insumos: InventarioReparacionInsumoBase[];
  servicios: InventarioReparacionServicioBase[];
}

export interface SyncInventarioReparacionBasePayload {
  insumos: Array<{
    id_insumo?: number;
    id_inventario_insumo?: number;
    cantidad: number;
  }>;
  servicios: Array<{
    id_servicio_taller: number;
    cantidad: number;
  }>;
}

