import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { RepuestoItem } from '../interfaces/repuesto.interface';

export const getRepuestosAction = async (): Promise<RepuestoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<RepuestoItem[]> | RepuestoItem[]>('/repuestos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener repuestos:', error);
    return [];
  }
};
