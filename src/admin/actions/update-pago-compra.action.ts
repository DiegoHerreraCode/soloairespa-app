import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoCompraItem } from '../interfaces/pago-compra.interface';

/**
 * Registra o liquida el abono de un pago a compra pendiente enviando FormData.
 * Se utiliza POST con `_method: 'PUT'` para soportar transferencia de archivos multipart
 * y actualizar el recurso en Laravel.
 */
export const updatePagoCompraAction = async (
  id: number | string,
  formData: FormData
): Promise<PagoCompraItem> => {
  // Asegurar method spoofing de Laravel para multipart/form-data
  if (!formData.has('_method')) {
    formData.append('_method', 'PUT');
  }

  const { data } = await apiClient.post<ApiResponse<PagoCompraItem> | PagoCompraItem>(
    `/pagos-compras/${id}`,
    formData
  );

  return 'data' in data ? data.data : data;
};
