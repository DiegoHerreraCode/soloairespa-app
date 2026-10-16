import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PersonalItem } from '../interfaces/personal.interface';

export const getPersonalAction = async (): Promise<PersonalItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PersonalItem[]> | PersonalItem[]>('/personal');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener personal:', error);
    return [];
  }
};
