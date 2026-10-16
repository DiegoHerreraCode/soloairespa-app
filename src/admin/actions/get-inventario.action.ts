import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { InventarioItem } from '../interfaces/inventario.interface';

export const getInventarioAction = async (): Promise<InventarioItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<InventarioItem[]> | InventarioItem[]>('/inventario');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return [];
  }
};
