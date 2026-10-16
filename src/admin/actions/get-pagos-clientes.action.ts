import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoClienteItem } from '../interfaces/pago-cliente.interface';

export const getPagosClientesAction = async (): Promise<PagoClienteItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PagoClienteItem[]> | PagoClienteItem[]>('/pagos-clientes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener pagos de clientes:', error);
    return [];
  }
};
