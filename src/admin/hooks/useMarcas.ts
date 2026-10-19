import { useQuery } from '@tanstack/react-query';
import { getMarcasAction } from '../actions/get-marcas.action';

export const useMarcas = () => {
  const marcasQuery = useQuery({
    queryKey: ['marcas-listado'],
    queryFn: getMarcasAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    marcas: marcasQuery.data || [],
    isLoading: marcasQuery.isLoading,
    isError: marcasQuery.isError,
    refetch: marcasQuery.refetch,
  };
};
