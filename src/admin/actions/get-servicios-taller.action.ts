import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ServicioTallerItem } from '../interfaces/servicio-taller.interface';

export const getServiciosTallerAction = async (): Promise<ServicioTallerItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ServicioTallerItem[]> | ServicioTallerItem[]>('/servicios-taller');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener servicios de taller:', error);
    return [];
  }
};
