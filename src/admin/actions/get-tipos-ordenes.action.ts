import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoOrdenItem } from '../interfaces/tipo-orden.interface';

export const getTiposOrdenesAction = async (): Promise<TipoOrdenItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoOrdenItem[]> | TipoOrdenItem[]>('/tipos-ordenes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de órdenes:', error);
    return [];
  }
};
