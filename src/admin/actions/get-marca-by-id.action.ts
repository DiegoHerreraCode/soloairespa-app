import { apiClient } from '@/api/apiClient';
import type { MarcaItem } from '../interfaces/marca.interface';
import type { ApiResponse } from '../interfaces/api-response.interface';

export const getMarcaByIdAction = async (id: number | string): Promise<MarcaItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<MarcaItem> | MarcaItem>(`/marcas/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener marca por ID:', error);
    return null;
  }
};
