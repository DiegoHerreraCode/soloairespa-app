import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createAsignacionAction } from '../actions/create-asignacion.action';

interface GuardarAsignacionesVariables {
  idReparacion: string;
  idRepServicioNum: number;
  empleadosSeleccionados: { id_personal: number; nombre: string; rut: string }[];
}

export const useAsignacionMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const guardarMutation = useMutation({
    mutationFn: async ({
      idRepServicioNum,
      empleadosSeleccionados,
    }: GuardarAsignacionesVariables) => {
      // Como la asignación ocurre una única vez (el servicio pasa a 'en_espera' y no se vuelve a asignar),
      // registramos las asignaciones de los empleados seleccionados
      for (const emp of empleadosSeleccionados) {
        await createAsignacionAction({
          id_reparacion_servicio_taller: idRepServicioNum,
          id_personal: emp.id_personal,
        });
      }
    },
    onSuccess: (_, variables) => {
      toast.success('Personal asignado exitosamente al servicio');

      queryClient.invalidateQueries({ queryKey: ['asignaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparacion-item', variables.idReparacion] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-servicios-taller'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['personal-listado'] });

      navigate(`/admin/taller/reparaciones/${variables.idReparacion}`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al guardar la asignación de personal';
      toast.error(msg);
    },
  });

  return {
    guardarAsignaciones: guardarMutation.mutate,
    isSaving: guardarMutation.isPending,
  };
};
