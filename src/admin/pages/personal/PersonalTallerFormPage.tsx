import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench } from 'lucide-react';
import { getPersonalByIdAction } from '../../actions/get-personal-by-id.action';
import { usePersonalMutation } from '../../hooks/usePersonalMutation';
import type { CreateUpdatePersonalPayload } from '../../actions/create-update-personal.action';

export const PersonalTallerFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  // Hook dedicado para guardar/actualizar personal (Estilo Teslo Shop)
  const { savePersonal, isPending } = usePersonalMutation();

  // Consulta los datos del personal si estamos en modo edición
  const { data: personalData, isLoading: isLoadingPersonal } = useQuery({
    queryKey: ['personal-item', id],
    queryFn: () => getPersonalByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario local
  const [formData, setFormData] = useState<CreateUpdatePersonalPayload>({
    nombre: '',
    rut: '',
    correo: '',
    num_tlf: '',
    direccion: '',
    disponible: true,
    is_deleted: false,
  });

  // Sincronizar datos al cargar el personal existente
  useEffect(() => {
    if (personalData) {
      setFormData({
        nombre: personalData.nombre || '',
        rut: personalData.rut || '',
        correo: personalData.correo || '',
        num_tlf: personalData.num_tlf || '',
        direccion: personalData.direccion || '',
        disponible: personalData.disponible ?? true,
        is_deleted: personalData.is_deleted ?? false,
      });
    }
  }, [personalData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.rut || !formData.correo || !formData.num_tlf || !formData.direccion) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    savePersonal({
      payload: formData,
      id: isCreating ? undefined : id,
    });
  };

  if (isLoadingPersonal) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/personal/taller"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Personal de Taller' : 'Editar Personal de Taller'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo técnico u operario al taller mecánico'
                : `Modificando datos del técnico: ${formData.nombre}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Carlos Pérez"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* RUT */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              RUT <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="Ej: 12.345.678-9"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@soloairespa.cl"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Número de Teléfono <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="num_tlf"
              value={formData.num_tlf}
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Dirección Residencial <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Av. Providencia 1234, Santiago"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Disponibilidad */}
          <div className="p-4 rounded-xl bg-accent/40 border border-border/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Disponibilidad Operativa
              </span>
              <span className="text-[11px] text-muted-foreground">
                Habilita si el técnico está apto para tomar reparaciones activas
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="disponible"
                checked={formData.disponible}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Estado de Retiro / Baja Lógica (Solo en Edición) */}
          {!isCreating && (
            <div className="p-4 rounded-xl bg-accent/40 border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Estado en Taller (Baja Lógica)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Marcar si el técnico ya no labora en el taller (Fuera del Taller)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_deleted"
                  checked={formData.is_deleted}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          )}
        </div>

        {/* Botón de Enviar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/personal/taller"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalTallerFormPage;
