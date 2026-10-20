import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionServicioTallerItem } from '../interfaces/reparacion.interface';

export const getReparacionesServiciosTallerAction = async (): Promise<ReparacionServicioTallerItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ReparacionServicioTallerItem[]> | ReparacionServicioTallerItem[]>('/reparaciones-servicios-taller');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener servicios de reparaciones:', error);
    return [];
  }
};
