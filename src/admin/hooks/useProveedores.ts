import { useQuery } from '@tanstack/react-query';
import { getProveedoresAction } from '../actions/get-proveedores.action';

export const useProveedores = () => {
  const proveedoresQuery = useQuery({
    queryKey: ['proveedores-listado'],
    queryFn: getProveedoresAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  return {
    proveedores: proveedoresQuery.data || [],
    isLoading: proveedoresQuery.isLoading,
    isError: proveedoresQuery.isError,
    refetch: proveedoresQuery.refetch,
  };
};
