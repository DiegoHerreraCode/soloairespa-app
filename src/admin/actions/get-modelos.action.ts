import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ModeloItem } from '../interfaces/modelo.interface';

export const getModelosAction = async (): Promise<ModeloItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ModeloItem[]> | ModeloItem[]>('/modelos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener modelos:', error);
    return [];
  }
};
