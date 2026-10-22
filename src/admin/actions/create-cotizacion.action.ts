import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CotizacionItem } from '../interfaces/cotizacion.interface';

export interface CreateCotizacionVentaDetallePayload {
  id_inventario_repuesto_saliente?: number;
  id_inventario_insumo_saliente?: number;
  cantidad: number;
  precio_unitario: number;
  porcentaje_iva: number;
}

export interface CreateCotizacionVentaPayload {
  id_cliente: number;
  id_tipo_orden: number;
  detalles_inventario: CreateCotizacionVentaDetallePayload[];
}

export interface CreateCotizacionRecambioDetallePayload {
  id_inventario_repuesto_saliente: number;
  id_inventario_repuesto_entrante: number;
  cantidad: number;
  precio_unitario: number;
  monto_tasacion: number;
  porcentaje_iva: number;
}

export interface CreateCotizacionRecambioPayload {
  id_cliente: number;
  id_tipo_orden: number;
  detalles_inventario: CreateCotizacionRecambioDetallePayload[];
}

export interface CreateCotizacionReparacionInsumoDetallePayload {
  service_tag_repuesto_a_reparar: string;
  id_inventario_insumo_saliente: number;
  cantidad: number;
  precio_unitario: number;
  porcentaje_iva: number;
}

export interface CreateCotizacionReparacionServicioDetallePayload {
  service_tag_repuesto_a_reparar: string;
  id_servicio_taller: number;
  cantidad: number;
  precio_unitario: number;
  porcentaje_iva: number;
}

export interface CreateCotizacionReparacionPayload {
  id_cliente: number;
  id_tipo_orden: number;
  num_repuestos_a_reparar: number;
  services_tags_repuestos_a_reparar: string[];
  detalles_inventario: CreateCotizacionReparacionInsumoDetallePayload[];
  detalles_servicios: CreateCotizacionReparacionServicioDetallePayload[];
}

export const createCotizacionAction = async (
  payload:
    | CreateCotizacionVentaPayload
    | CreateCotizacionRecambioPayload
    | CreateCotizacionReparacionPayload
    | Record<string, any>
): Promise<CotizacionItem> => {
  const { data } = await apiClient.post<ApiResponse<CotizacionItem> | CotizacionItem>(
    '/cotizaciones',
    payload
  );
  return 'data' in data ? data.data : data;
};
