import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PersonalItem } from '../interfaces/personal.interface';

export const getPersonalByIdAction = async (id: number | string): Promise<PersonalItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PersonalItem> | PersonalItem>(`/personal/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener personal por id:', error);
    return null;
  }
};
