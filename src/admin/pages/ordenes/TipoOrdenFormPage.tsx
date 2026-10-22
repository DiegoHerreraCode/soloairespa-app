import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Layers, AlignLeft, Tag } from 'lucide-react';
import { getTipoOrdenByIdAction } from '../../actions/get-tipo-orden-by-id.action';
import { useTipoOrdenMutation } from '../../hooks/useTipoOrdenMutation';

export const TipoOrdenFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario estamos editando
  const isCreating = !id || id === 'new';

  const { saveTipoOrden, isPending } = useTipoOrdenMutation();

  // Consulta de datos del tipo de orden si estamos editando
  const { data: tipoOrdenData, isLoading: isLoadingTipoOrden } = useQuery({
    queryKey: ['tipo-orden-item', id],
    queryFn: () => getTipoOrdenByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Sincronizar datos al editar
  useEffect(() => {
    if (tipoOrdenData) {
      setNombre(tipoOrdenData.nombre || '');
      setDescripcion(tipoOrdenData.descripcion || '');
    }
  }, [tipoOrdenData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del tipo de orden');
      return;
    }

    if (isCreating) {
      saveTipoOrden({
        payload: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
        },
        id: undefined,
      });
    } else {
      saveTipoOrden({
        payload: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
        },
        id,
      });
    }
  };

  if (!isCreating && isLoadingTipoOrden) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/ordenes/tipos-ordenes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500" />
              {isCreating ? `Registrar Nuevo Tipo de Orden` : `Editar Tipo de Orden #${id}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Asocia un nuevo tipo de orden'
                : 'Modificación de las propiedades descriptivas del tipo de orden'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta del Formulario */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Campo: Nombre del Tipo de Orden */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Nombre del Tipo de Orden <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mantenimiento Preventivo"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          {/* Campo: Descripción del Tipo de Orden */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
              Descripción
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción técnica o especificaciones del tipo de orden..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Botón de Enviar */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending
                ? 'Guardando...'
                : isCreating
                  ? 'Registrar Tipo de Orden'
                  : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TipoOrdenFormPage;
