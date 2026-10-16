import { useQuery } from '@tanstack/react-query';
import { getClientesAction } from '../actions/get-clientes.action';

export const useClientes = () => {
  const clientesQuery = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  return {
    clientes: clientesQuery.data || [],
    isLoading: clientesQuery.isLoading,
    isError: clientesQuery.isError,
    refetch: clientesQuery.refetch,
  };
};
