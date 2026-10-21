import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CotizacionItem } from '../interfaces/cotizacion.interface';

export const getCotizacionesAction = async (): Promise<CotizacionItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<CotizacionItem[]> | CotizacionItem[]>('/cotizaciones');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return [];
  }
};
