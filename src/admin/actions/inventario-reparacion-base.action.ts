import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  InventarioReparacionBaseResponse,
  SyncInventarioReparacionBasePayload,
} from '../interfaces/inventario-reparacion-base.interface';

export const getInventarioReparacionBaseAction = async (
  idInventario: number
): Promise<InventarioReparacionBaseResponse | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<InventarioReparacionBaseResponse>>(
      `/inventario/${idInventario}/reparacion-base`
    );
    return data.data;
  } catch (error) {
    console.error(`Error al obtener base de reparación para ítem #${idInventario}:`, error);
    return null;
  }
};

export const syncInventarioReparacionBaseAction = async (
  idInventario: number,
  payload: SyncInventarioReparacionBasePayload
): Promise<InventarioReparacionBaseResponse | null> => {
  try {
    const { data } = await apiClient.post<ApiResponse<InventarioReparacionBaseResponse>>(
      `/inventario/${idInventario}/reparacion-base`,
      payload
    );
    return data.data;
  } catch (error) {
    console.error(`Error al sincronizar base de reparación para ítem #${idInventario}:`, error);
    throw error;
  }
};

