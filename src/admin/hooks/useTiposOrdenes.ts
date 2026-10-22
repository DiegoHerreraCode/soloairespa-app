import { useQuery } from '@tanstack/react-query';
import { getTiposOrdenesAction } from '../actions/get-tipos-ordenes.action';

export const useTiposOrdenes = () => {
    const tiposOrdenesQuery = useQuery({
        queryKey: ['tipos-ordenes-listado'],
        queryFn: getTiposOrdenesAction,
        staleTime: 1000 * 60 * 5,
    });

    return {
        tiposOrdenes: tiposOrdenesQuery.data || [],
        isLoading: tiposOrdenesQuery.isLoading,
        isError: tiposOrdenesQuery.isError,
        refetch: tiposOrdenesQuery.refetch,
    };
};
