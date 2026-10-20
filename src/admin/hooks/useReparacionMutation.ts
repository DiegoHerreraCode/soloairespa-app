import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateReparacionAction,
  type CreateUpdateReparacionPayload,
} from '../actions/create-update-reparacion.action';

export const useReparacionMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateReparacionPayload;
      id?: string;
    }) => createUpdateReparacionAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Reparación registrada correctamente'
          : 'Reparación actualizada correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparacion-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-servicios-taller'] });
      navigate('/admin/taller/reparaciones');
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
    saveReparacion: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
