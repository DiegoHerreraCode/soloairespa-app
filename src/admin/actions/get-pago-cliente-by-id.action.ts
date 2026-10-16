import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoClienteItem } from '../interfaces/pago-cliente.interface';

export const getPagoClienteByIdAction = async (id: number | string): Promise<PagoClienteItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PagoClienteItem> | PagoClienteItem>(
      `/pagos-clientes/${id}`
    );
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener pago de cliente por ID:', error);
    return null;
  }
};
