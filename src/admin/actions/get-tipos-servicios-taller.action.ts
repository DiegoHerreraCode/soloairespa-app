import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoServicioTallerItem } from '../interfaces/tipo-servicio-taller.interface';

export const getTiposServiciosTallerAction = async (): Promise<TipoServicioTallerItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoServicioTallerItem[]> | TipoServicioTallerItem[]>('/tipos-servicios-taller');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de servicios de taller:', error);
    return [];
  }
};
