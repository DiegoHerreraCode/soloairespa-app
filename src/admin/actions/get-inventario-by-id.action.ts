import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { InventarioItem } from '../interfaces/inventario.interface';

export const getInventarioByIdAction = async (id: number | string): Promise<InventarioItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<InventarioItem> | InventarioItem>(`/inventario/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener ítem de inventario por ID:', error);
    return null;
  }
};
