import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ClienteItem } from '../interfaces/cliente.interface';

export const getClientesAction = async (): Promise<ClienteItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ClienteItem[]> | ClienteItem[]>('/clientes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
};
