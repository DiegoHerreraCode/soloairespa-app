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

export const createCotizacionAction = async (
  payload: CreateCotizacionVentaPayload | Record<string, any>
): Promise<CotizacionItem> => {
  const { data } = await apiClient.post<ApiResponse<CotizacionItem> | CotizacionItem>(
    '/cotizaciones',
    payload
  );
  return 'data' in data ? data.data : data;
};
