import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CotizacionItem } from '../interfaces/cotizacion.interface';

export const rechazarCotizacionAction = async (id: number | string): Promise<CotizacionItem> => {
  const { data } = await apiClient.patch<ApiResponse<CotizacionItem> | CotizacionItem>(
    `/cotizaciones/${id}/rechazar`
  );
  return 'data' in data ? data.data : data;
};
