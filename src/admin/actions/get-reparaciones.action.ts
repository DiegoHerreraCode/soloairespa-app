import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionItem } from '../interfaces/reparacion.interface';

export const getReparacionesAction = async (): Promise<ReparacionItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ReparacionItem[]> | ReparacionItem[]>('/reparaciones');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener reparaciones:', error);
    return [];
  }
};
