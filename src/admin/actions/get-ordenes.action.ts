import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { OrdenItem } from '../interfaces/orden.interface';

export const getOrdenesAction = async (): Promise<OrdenItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<OrdenItem[]> | OrdenItem[]>('/ordenes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return [];
  }
};
