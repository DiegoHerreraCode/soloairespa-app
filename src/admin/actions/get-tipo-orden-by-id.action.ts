import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoOrdenItem } from '../interfaces/tipo-orden.interface';

export const getTipoOrdenByIdAction = async (id: number | string): Promise<TipoOrdenItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoOrdenItem> | TipoOrdenItem>(`/tipos-ordenes/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener tipo de orden por ID:', error);
    return null;
  }
};
