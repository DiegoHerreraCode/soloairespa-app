import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';

export interface CotizacionExtraInsumoPayload {
  id_inventario_insumo_saliente: number;
  cantidad: number;
  precio_unitario_base: number;
  precio_unitario: number;
  porcentaje_iva: number;
}

export interface CotizacionExtraServicioPayload {
  id_servicio_taller: number;
  cantidad: number;
  precio_unitario_base: number;
  precio_unitario: number;
  porcentaje_iva: number;
}

export interface CreateCotizacionExtraPayload {
  crear_cotizacion_extra: true;
  insumos: CotizacionExtraInsumoPayload[];
  servicios: CotizacionExtraServicioPayload[];
}

export const createCotizacionExtraAction = async (
  idReparacion: number | string,
  payload: CreateCotizacionExtraPayload
): Promise<any> => {
  const { data } = await apiClient.put<ApiResponse<any> | any>(
    `/reparaciones/${idReparacion}`,
    payload
  );
  return 'data' in data ? data.data : data;
};
