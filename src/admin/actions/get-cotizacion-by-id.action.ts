import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CotizacionItem } from '../interfaces/cotizacion.interface';

export const getCotizacionByIdAction = async (id: number | string): Promise<CotizacionItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<CotizacionItem> | CotizacionItem>(`/cotizaciones/${id}`);
    return 'data' in data ? data.data : data;
  } catch (error) {
    console.error(`Error al obtener cotización con ID ${id}:`, error);
    return null;
  }
};
