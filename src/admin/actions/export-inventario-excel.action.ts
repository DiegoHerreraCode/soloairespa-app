import { apiClient } from '@/api/apiClient';

export interface ExportInventarioParams {
  sku?: string;
  nombre?: string;
  tipo?: string;
  condicion?: string;
}

export const exportInventarioExcelAction = async (params: ExportInventarioParams): Promise<void> => {
  // Solo enviar filtros con valor significativo
  const queryParams: Record<string, string> = {};

  if (params.sku && params.sku.trim() !== '') {
    queryParams.sku = params.sku.trim();
  }
  if (params.nombre && params.nombre.trim() !== '') {
    queryParams.nombre = params.nombre.trim();
  }
  if (params.tipo && params.tipo !== 'all') {
    queryParams.tipo = params.tipo;
  }
  if (params.condicion && params.condicion !== 'all') {
    queryParams.condicion = params.condicion;
  }

  try {
    const response = await apiClient.get('/inventario/export/excel', {
      params: queryParams,
      responseType: 'blob',
    });

    // Intentar obtener el nombre del archivo desde el header Content-Disposition si viene del backend
    let filename = `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    // Crear Blob y disparar la descarga
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Limpiar recursos
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    // Si la respuesta es un Blob con error (ej. JSON de error de Laravel con status 500)
    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        console.error('Detalle del error en Laravel:', errorJson);
      } catch {
        const errorText = await error.response.data.text();
        console.error('Respuesta cruda del servidor:', errorText);
      }
    }
    throw error;
  }
};

