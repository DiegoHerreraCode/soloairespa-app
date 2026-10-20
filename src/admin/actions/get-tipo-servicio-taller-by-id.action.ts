import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoServicioTallerItem } from '../interfaces/tipo-servicio-taller.interface';

export const getTipoServicioTallerByIdAction = async (id: number | string): Promise<TipoServicioTallerItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoServicioTallerItem> | TipoServicioTallerItem>(`/tipos-servicios-taller/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener tipo de servicio de taller por ID:', error);
    return null;
  }
};
