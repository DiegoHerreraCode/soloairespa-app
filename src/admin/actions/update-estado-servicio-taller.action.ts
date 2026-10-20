import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionServicioTallerItem } from '../interfaces/reparacion.interface';

export const updateEstadoServicioTallerAction = async (
  id_reparacion_servicio_taller: number | string,
  estado: 'pendiente_asignacion' | 'en_espera' | 'en_proceso' | 'finalizado'
): Promise<ReparacionServicioTallerItem> => {
  const { data } = await apiClient.put<ApiResponse<ReparacionServicioTallerItem> | ReparacionServicioTallerItem>(
    `/reparaciones-servicios-taller/${id_reparacion_servicio_taller}`,
    { estado }
  );
  return 'data' in data ? data.data : data;
};
