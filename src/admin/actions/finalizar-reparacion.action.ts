import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionItem } from '../interfaces/reparacion.interface';

export interface InsumoDevueltoPayload {
  id_reparacion_insumo: number;
  cantidad_sobrante: number;
}

export const finalizarReparacionAction = async (
  id: number | string,
  insumosDevueltos?: InsumoDevueltoPayload[]
): Promise<ReparacionItem> => {
  const { data } = await apiClient.put<ApiResponse<ReparacionItem> | ReparacionItem>(
    `/reparaciones/${id}`,
    {
      estado: 'finalizada',
      ...(insumosDevueltos ? { insumos_devueltos: insumosDevueltos } : {}),
    }
  );
  return 'data' in data ? data.data : data;
};

