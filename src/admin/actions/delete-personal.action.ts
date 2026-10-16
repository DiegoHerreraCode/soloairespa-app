import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PersonalItem } from '../interfaces/personal.interface';

export const deletePersonalAction = async (id: number | string): Promise<PersonalItem> => {
  const { data } = await apiClient.delete<ApiResponse<PersonalItem> | PersonalItem>(`/personal/${id}`);
  return 'data' in data ? data.data : data;
};
