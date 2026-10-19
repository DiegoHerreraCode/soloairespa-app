import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Layers, Building2, AlignLeft, Tag } from 'lucide-react';
import { getModeloByIdAction } from '../../actions/get-modelo-by-id.action';
import { getMarcasAction } from '../../actions/get-marcas.action';
import { useModeloMutation } from '../../hooks/useModeloMutation';

export const ModeloFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario estamos editando
  const isCreating = !id || id === 'new';

  const { saveModelo, isPending } = useModeloMutation();

  // Consulta del catálogo de marcas
  const { data: marcas = [], isLoading: isLoadingMarcas } = useQuery({
    queryKey: ['marcas-listado'],
    queryFn: getMarcasAction,
  });

  // Consulta de datos del modelo si estamos editando
  const { data: modeloData, isLoading: isLoadingModelo } = useQuery({
    queryKey: ['modelo-item', id],
    queryFn: () => getModeloByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario
  const [idMarca, setIdMarca] = useState<number | ''>('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Sincronizar datos al editar
  useEffect(() => {
    if (modeloData) {
      setIdMarca(modeloData.id_marca);
      setNombre(modeloData.nombre || '');
      setDescripcion(modeloData.descripcion || '');
    }
  }, [modeloData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del modelo');
      return;
    }

    if (isCreating) {
      if (!idMarca) {
        toast.warning('Por favor selecciona una marca para el modelo');
        return;
      }

      saveModelo({
        payload: {
          id_marca: Number(idMarca),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
        },
        id: undefined,
      });
    } else {
      // Al editar: SOLO es editable su nombre y su descripcion, NO su id_marca
      saveModelo({
        payload: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
        },
        id,
      });
    }
  };

  if (!isCreating && isLoadingModelo) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Encontrar el nombre de la marca actual para mostrar cuando está bloqueada
  const marcaActual = marcas.find((m) => m.id_marca === Number(idMarca));

  return (
    <div className="space-y-6 max-w-2xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario/modelos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Modelo' : `Editar Modelo #${id}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Asocia un nuevo modelo técnico a una marca comercial'
                : 'Modificación de las propiedades descriptivas del modelo técnico'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta del Formulario */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo: Marca (id_marca) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              Marca Comercial
              {!isCreating && (
                <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                  (No editable)
                </span>
              )}
            </label>

            {isCreating ? (
              <select
                value={idMarca}
                onChange={(e) => setIdMarca(e.target.value ? Number(e.target.value) : '')}
                disabled={isLoadingMarcas}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                required
              >
                <option value="">-- Selecciona una marca --</option>
                {marcas.map((m) => (
                  <option key={m.id_marca} value={m.id_marca}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-sm font-bold text-foreground">
                  {marcaActual?.nombre || modeloData?.marca?.nombre || `Marca #${idMarca}`}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  La marca comercial de un modelo registrado no puede ser modificada.
                </p>
              </div>
            )}
          </div>

          {/* Campo: Nombre del Modelo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Nombre del Modelo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: ISM 350, UP6 15, etc."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          {/* Campo: Descripción del Modelo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
              Descripción
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción técnica o especificaciones del modelo..."
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
                  ? 'Registrar Modelo'
                  : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModeloFormPage;
