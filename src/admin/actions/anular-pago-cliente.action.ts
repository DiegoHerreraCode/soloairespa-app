import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoClienteItem } from '../interfaces/pago-cliente.interface';

export const anularPagoClienteAction = async (
  id: number | string,
  motivo_anulacion: string
): Promise<PagoClienteItem> => {
  const { data } = await apiClient.patch<ApiResponse<PagoClienteItem> | PagoClienteItem>(
    `/pagos-clientes/${id}/anular`,
    { motivo_anulacion }
  );
  return 'data' in data ? data.data : data;
};
