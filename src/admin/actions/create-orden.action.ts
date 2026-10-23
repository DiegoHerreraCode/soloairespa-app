import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { OrdenItem } from '../interfaces/orden.interface';

// Detalle para insumo en venta
export interface CreateOrdenVentaDetalleInsumoPayload {
  id_inventario_insumo_saliente: number;
  cantidad: number;
  precio_unitario: number;
  porcentaje_iva: number;
}

// Repuesto físico saliente dentro de repuestos_salientes
export interface CreateOrdenRepuestoSalienteItem {
  id_repuesto: number;
  precio_unitario: number;
}

// Detalle para repuesto serializado en venta
export interface CreateOrdenVentaDetalleRepuestoPayload {
  id_inventario_repuesto_saliente: number;
  porcentaje_iva: number;
  repuestos_salientes: CreateOrdenRepuestoSalienteItem[];
}

export type CreateOrdenVentaDetallePayload =
  | CreateOrdenVentaDetalleInsumoPayload
  | CreateOrdenVentaDetalleRepuestoPayload;

export interface CreateOrdenVentaPayload {
  id_cliente: number;
  id_tipo_orden: number;
  detalles: CreateOrdenVentaDetallePayload[];
}

export const createOrdenAction = async (
  payload: CreateOrdenVentaPayload | Record<string, any>
): Promise<OrdenItem> => {
  const { data } = await apiClient.post<ApiResponse<OrdenItem> | OrdenItem>(
    '/ordenes',
    payload
  );
  return 'data' in data ? data.data : data;
};
