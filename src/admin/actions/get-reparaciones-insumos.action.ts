import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionInsumoItem } from '../interfaces/reparacion.interface';

export const getReparacionesInsumosAction = async (): Promise<ReparacionInsumoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ReparacionInsumoItem[]> | ReparacionInsumoItem[]>('/reparaciones-insumos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener insumos de reparaciones:', error);
    return [];
  }
};
