import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CotizacionItem } from '../interfaces/cotizacion.interface';

export const aceptarCotizacionAction = async (
  id: number | string,
  payload: Record<string, any> = {}
): Promise<CotizacionItem> => {
  const { data } = await apiClient.post<ApiResponse<CotizacionItem> | CotizacionItem>(
    `/cotizaciones/${id}/aceptar`,
    payload
  );
  return 'data' in data ? data.data : data;
};
