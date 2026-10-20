import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { AsignacionItem } from './get-asignaciones.action';

export interface CreateAsignacionPayload {
  id_reparacion_servicio_taller: number;
  id_personal: number;
}

export const createAsignacionAction = async (
  payload: CreateAsignacionPayload
): Promise<AsignacionItem> => {
  const { data } = await apiClient.post<ApiResponse<AsignacionItem> | AsignacionItem>(
    '/asignaciones',
    payload
  );
  return 'data' in data ? data.data : data;
};
