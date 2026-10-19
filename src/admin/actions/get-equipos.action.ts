import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { EquipoItem } from '../interfaces/equipo.interface';

export const getEquiposAction = async (): Promise<EquipoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<EquipoItem[]> | EquipoItem[]>('/equipos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    return [];
  }
};
