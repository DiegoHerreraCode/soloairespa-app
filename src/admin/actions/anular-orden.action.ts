import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { OrdenItem } from '../interfaces/orden.interface';

export interface InsumoDevueltoAnulacion {
  id_reparacion_insumo: number;
  cantidad_sobrante: number;
}

export interface AnularOrdenPayload {
  motivo_anulacion: string;
  insumos_devueltos?: InsumoDevueltoAnulacion[];
}

export const anularOrdenAction = async (
  id: number | string,
  payload: AnularOrdenPayload
): Promise<OrdenItem> => {
  const { data } = await apiClient.patch<ApiResponse<OrdenItem> | OrdenItem>(
    `/ordenes/${id}/anular`,
    payload
  );
  return 'data' in data ? data.data : data;
};
