import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ReparacionItem } from '../interfaces/reparacion.interface';

export interface InsumoPayload {
  id_reparacion_insumo?: number;
  id_inventario: number;
  cantidad: number;
  costo_unitario?: number;
  costo_unitario_con_ganancia?: number;
  porcentaje_iva?: number;
}

export interface ServicioPayload {
  id_reparacion_servicio_taller?: number;
  id_servicio_taller: number;
  cantidad: number;
  costo_unitario?: number;
  costo_unitario_con_ganancia?: number;
  porcentaje_iva?: number;
  estado?: string;
}

export interface CreateUpdateReparacionPayload {
  id_repuesto: number;
  id_orden?: number | null;
  estado?: 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  costo_servicios_base?: number;
  costo_insumos_base?: number;
  costo_servicios_con_ganancia?: number;
  costo_insumos_con_ganancia?: number;
  costo_total?: number;
  costo_total_con_ganancia?: number;
  monto_total_iva?: number;
  insumos?: InsumoPayload[];
  servicios?: ServicioPayload[];
}

export const createUpdateReparacionAction = async (
  payload: CreateUpdateReparacionPayload,
  id?: number | string
): Promise<ReparacionItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al editar de forma directa (sin cotización extra)
    const { data } = await apiClient.put<ApiResponse<ReparacionItem> | ReparacionItem>(
      `/reparaciones/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    // Al crear
    const { data } = await apiClient.post<ApiResponse<ReparacionItem> | ReparacionItem>(
      '/reparaciones',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
