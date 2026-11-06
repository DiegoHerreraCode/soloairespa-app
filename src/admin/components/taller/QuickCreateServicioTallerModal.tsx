import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Wrench, X, Save, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createUpdateServicioTallerAction } from '@/admin/actions/create-update-servicio-taller.action';
import { getTiposServiciosTallerAction } from '@/admin/actions/get-tipos-servicios-taller.action';
import type { ServicioTallerItem } from '@/admin/interfaces/servicio-taller.interface';
import { QuickCreateTipoServicioModal } from './QuickCreateTipoServicioModal';

interface QuickCreateServicioTallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (servicio: ServicioTallerItem) => void;
  defaultTipoServicioId?: number;
}

export const QuickCreateServicioTallerModal: React.FC<QuickCreateServicioTallerModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultTipoServicioId,
}) => {
  const queryClient = useQueryClient();

  const { data: tiposServicios = [] } = useQuery({
    queryKey: ['tipos-servicios-taller-listado'],
    queryFn: getTiposServiciosTallerAction,
    enabled: isOpen,
  });

  const [idTipoServicio, setIdTipoServicio] = useState<number | ''>(defaultTipoServicioId || '');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costoBase, setCostoBase] = useState<number>(0);
  const [porcentajeIva, setPorcentajeIva] = useState<number>(19);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(30);
  const [isQuickTipoOpen, setIsQuickTipoOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: {
      id_tipo_servicio_taller: number;
      nombre: string;
      descripcion?: string;
      costo_base: number;
      porcentaje_iva: number;
      porcentaje_ganancia: number;
    }) => createUpdateServicioTallerAction(payload),
    onSuccess: (nuevoServicio) => {
      toast.success(`Servicio "${nuevoServicio.nombre}" creado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['servicios-taller'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-taller-listado'] });
      onCreated(nuevoServicio);
      handleReset();
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      const errors = err?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
        return;
      }
      toast.error(err?.response?.data?.message || 'Error al crear el servicio del taller');
    },
  });

  const handleReset = () => {
    setIdTipoServicio(defaultTipoServicioId || '');
    setNombre('');
    setDescripcion('');
    setCostoBase(0);
    setPorcentajeIva(19);
    setPorcentajeGanancia(30);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idTipoServicio) {
      toast.warning('Selecciona una categoría/tipo de servicio');
      return;
    }
    if (!nombre.trim()) {
      toast.warning('Ingresa el nombre del servicio');
      return;
    }
    if (costoBase <= 0) {
      toast.warning('Ingresa un costo base válido mayor a 0');
      return;
    }

    mutation.mutate({
      id_tipo_servicio_taller: Number(idTipoServicio),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      costo_base: Number(costoBase),
      porcentaje_iva: Number(porcentajeIva),
      porcentaje_ganancia: Number(porcentajeGanancia),
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="relative bg-card border border-border/90 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 overflow-hidden">
          {mutation.isPending && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2.5 animate-fadeIn">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Registrando servicio de taller...
              </p>
            </div>
          )}

          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-500" />
              Nuevo Servicio de Taller
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Tipo de Servicio <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickTipoOpen(true)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Tipo
                </button>
              </div>
              <select
                required
                value={idTipoServicio}
                onChange={(e) => setIdTipoServicio(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="">-- Seleccionar Tipo de Servicio --</option>
                {tiposServicios.map((t) => (
                  <option key={t.id_tipo_servicio_taller} value={t.id_tipo_servicio_taller}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Nombre del Servicio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Cambio de Rodamientos y Bobinado"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Costo Base ($) *</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={costoBase || ''}
                  onChange={(e) => setCostoBase(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">% Ganancia</label>
                <input
                  type="number"
                  min={0}
                  value={porcentajeGanancia}
                  onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">% IVA</label>
                <input
                  type="number"
                  min={0}
                  value={porcentajeIva}
                  onChange={(e) => setPorcentajeIva(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Descripción (Opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Detalle de labores incluidas..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Crear Servicio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <QuickCreateTipoServicioModal
        isOpen={isQuickTipoOpen}
        onClose={() => setIsQuickTipoOpen(false)}
        onCreated={(nuevo) => setIdTipoServicio(nuevo.id_tipo_servicio_taller)}
      />
    </>
  );
};

