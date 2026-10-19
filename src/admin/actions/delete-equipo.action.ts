import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { EquipoItem } from '../interfaces/equipo.interface';

export const deleteEquipoAction = async (id: number | string): Promise<EquipoItem> => {
  const { data } = await apiClient.delete<ApiResponse<EquipoItem> | EquipoItem>(`/equipos/${id}`);
  return 'data' in data ? data.data : data;
};
