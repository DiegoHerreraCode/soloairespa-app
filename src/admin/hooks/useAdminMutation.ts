import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateAdminAction,
  type CreateAdminPayload,
  type UpdateAdminPayload,
} from '../actions/create-update-admin.action';

export const useAdminMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateAdminPayload | UpdateAdminPayload;
      id?: string;
    }) => createUpdateAdminAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Administrador registrado exitosamente'
          : 'Administrador actualizado exitosamente'
      );
      queryClient.invalidateQueries({ queryKey: ['administradores-sistema'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['admin-item', variables.id] });
      }
      navigate('/admin/personal/administradores');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey][0];
        toast.error(firstMsg);
        return;
      }
      const msg =
        error.response?.data?.message ||
        'Error al procesar la solicitud. Revisa los datos ingresados.';
      toast.error(msg);
    },
  });

  return {
    saveAdmin: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
