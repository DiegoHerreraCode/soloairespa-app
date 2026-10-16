import { useQuery } from '@tanstack/react-query';
import { getAdminsAction } from '../actions/get-admins.action';

export const useAdmins = () => {
  const adminsQuery = useQuery({
    queryKey: ['administradores-sistema'],
    queryFn: getAdminsAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  return {
    admins: adminsQuery.data || [],
    isLoading: adminsQuery.isLoading,
    isError: adminsQuery.isError,
    refetch: adminsQuery.refetch,
  };
};
