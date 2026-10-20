import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ServicioTallerItem } from '../interfaces/servicio-taller.interface';

export const getServicioTallerByIdAction = async (id: number | string): Promise<ServicioTallerItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ServicioTallerItem> | ServicioTallerItem>(`/servicios-taller/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener servicio de taller por ID:', error);
    return null;
  }
};
