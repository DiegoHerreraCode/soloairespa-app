import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoCompraItem } from '../interfaces/pago-compra.interface';

export const getPagosComprasAction = async (): Promise<PagoCompraItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PagoCompraItem[]> | PagoCompraItem[]>('/pagos-compras');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener pagos a compras:', error);
    return [];
  }
};
