import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { RepuestoItem } from '../interfaces/repuesto.interface';

export const getRepuestoByIdAction = async (id: number | string): Promise<RepuestoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<RepuestoItem> | RepuestoItem>(`/repuestos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener repuesto por ID:', error);
    return null;
  }
};
