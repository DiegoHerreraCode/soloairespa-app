import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { OrdenItem } from '../interfaces/orden.interface';

export const getOrdenByIdAction = async (id: number | string): Promise<OrdenItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<OrdenItem> | OrdenItem>(`/ordenes/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error(`Error al obtener la orden #${id}:`, error);
    return null;
  }
};
