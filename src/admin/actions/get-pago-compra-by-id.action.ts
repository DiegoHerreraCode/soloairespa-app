import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoCompraItem } from '../interfaces/pago-compra.interface';

export const getPagoCompraByIdAction = async (id: number | string): Promise<PagoCompraItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PagoCompraItem> | PagoCompraItem>(`/pagos-compras/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener pago a compra por ID:', error);
    return null;
  }
};
