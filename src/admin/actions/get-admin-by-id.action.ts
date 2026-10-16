import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { AdminItem } from '../interfaces/admin.interface';

export const getAdminByIdAction = async (id: number | string): Promise<AdminItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<AdminItem> | AdminItem>(`/admins/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener administrador por ID:', error);
    return null;
  }
};
