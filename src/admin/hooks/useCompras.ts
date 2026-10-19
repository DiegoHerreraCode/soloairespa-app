import { useQuery } from '@tanstack/react-query';
import { getComprasAction } from '../actions/get-compras.action';
import { getProveedoresAction } from '../actions/get-proveedores.action';

export const useCompras = () => {
  const comprasQuery = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const proveedoresQuery = useQuery({
    queryKey: ['proveedores-listado'],
    queryFn: getProveedoresAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    compras: comprasQuery.data || [],
    proveedores: proveedoresQuery.data || [],
    isLoading: comprasQuery.isLoading || proveedoresQuery.isLoading,
    isError: comprasQuery.isError,
    refetch: () => {
      comprasQuery.refetch();
      proveedoresQuery.refetch();
    },
  };
};
