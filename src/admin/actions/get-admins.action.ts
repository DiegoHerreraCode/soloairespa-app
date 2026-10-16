import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { AdminItem } from '../interfaces/admin.interface';

export const getAdminsAction = async (): Promise<AdminItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<AdminItem[]> | AdminItem[]>('/admins');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener administradores:', error);
    return [];
  }
};
