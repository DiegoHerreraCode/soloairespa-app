import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { EquipoItem } from '../interfaces/equipo.interface';

export const recuperarEquipoAction = async (id: number | string): Promise<EquipoItem> => {
  const { data } = await apiClient.put<ApiResponse<EquipoItem> | EquipoItem>(`/equipos/${id}`, {
    is_deleted: false,
  });
  return 'data' in data ? data.data : data;
};
