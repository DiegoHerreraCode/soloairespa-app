import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CotizacionItem } from '../interfaces/cotizacion.interface';

export const anularCotizacionAction = async (
  id: number | string,
  motivo_anulacion: string
): Promise<CotizacionItem> => {
  const { data } = await apiClient.patch<ApiResponse<CotizacionItem> | CotizacionItem>(
    `/cotizaciones/${id}/anular`,
    { motivo_anulacion }
  );
  return 'data' in data ? data.data : data;
};
