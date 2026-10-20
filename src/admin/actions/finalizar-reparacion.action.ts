import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionItem } from '../interfaces/reparacion.interface';

export const finalizarReparacionAction = async (id: number | string): Promise<ReparacionItem> => {
  const { data } = await apiClient.put<ApiResponse<ReparacionItem> | ReparacionItem>(
    `/reparaciones/${id}`,
    {
      estado: 'finalizada',
    }
  );
  return 'data' in data ? data.data : data;
};
