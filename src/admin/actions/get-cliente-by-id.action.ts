import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ClienteItem } from '../interfaces/cliente.interface';

export const getClienteByIdAction = async (id: number | string): Promise<ClienteItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ClienteItem> | ClienteItem>(`/clientes/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener cliente por ID:', error);
    return null;
  }
};
