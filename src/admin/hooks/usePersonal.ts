import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPersonalAction } from '../actions/get-personal.action';
import { deletePersonalAction } from '../actions/delete-personal.action';
import { toast } from 'sonner';

export const usePersonal = () => {
  const queryClient = useQueryClient();

  const personalQuery = useQuery({
    queryKey: ['personal-taller'],
    queryFn: getPersonalAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePersonalAction(id),
    onSuccess: () => {
      toast.success('Trabajador eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['personal-taller'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al eliminar al trabajador';
      toast.error(msg);
    },
  });

  return {
    personal: personalQuery.data || [],
    isLoading: personalQuery.isLoading,
    isError: personalQuery.isError,
    refetch: personalQuery.refetch,
    deletePersonal: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
