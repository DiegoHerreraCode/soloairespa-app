import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ModeloItem } from '../interfaces/modelo.interface';

export const getModeloByIdAction = async (id: number | string): Promise<ModeloItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ModeloItem> | ModeloItem>(`/modelos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener modelo por ID:', error);
    return null;
  }
};
