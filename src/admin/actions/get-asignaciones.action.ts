import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';

export interface AsignacionItem {
  id_asignacion: number;
  id_reparacion_servicio_taller: number;
  id_personal: number;
  created_at?: string;
  updated_at?: string;
}

export const getAsignacionesAction = async (): Promise<AsignacionItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<AsignacionItem[]> | AsignacionItem[]>('/asignaciones');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    return [];
  }
};
