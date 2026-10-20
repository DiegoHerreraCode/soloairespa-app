import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionItem } from '../interfaces/reparacion.interface';

export const getReparacionByIdAction = async (id: number | string): Promise<ReparacionItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ReparacionItem> | ReparacionItem>(`/reparaciones/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener reparación por ID:', error);
    return null;
  }
};
