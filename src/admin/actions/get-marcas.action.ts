import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaItem } from '../interfaces/marca.interface';

export const getMarcasAction = async (): Promise<MarcaItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<MarcaItem[]> | MarcaItem[]>('/marcas');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    return [];
  }
};
