import { useQuery } from '@tanstack/react-query';
import { getModelosAction } from '../actions/get-modelos.action';
import { getMarcasAction } from '../actions/get-marcas.action';

export const useModelos = () => {
  const modelosQuery = useQuery({
    queryKey: ['modelos-listado'],
    queryFn: getModelosAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const marcasQuery = useQuery({
    queryKey: ['marcas-listado'],
    queryFn: getMarcasAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    modelos: modelosQuery.data || [],
    marcas: marcasQuery.data || [],
    isLoading: modelosQuery.isLoading || marcasQuery.isLoading,
    isError: modelosQuery.isError,
    refetch: () => {
      modelosQuery.refetch();
      marcasQuery.refetch();
    },
  };
};
