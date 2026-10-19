import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Package,
  Barcode,
  Layers,
  Percent,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { getInventarioByIdAction } from '../../actions/get-inventario-by-id.action';
import { getModelosAction } from '../../actions/get-modelos.action';
import { useItemMutation } from '../../hooks/useItemMutation';

export const ItemFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario estamos editando
  const isCreating = !id || id === 'new';

  const { saveItem, isPending } = useItemMutation();

  // Consulta de modelos para selección al crear
  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos-listado'],
    queryFn: getModelosAction,
  });

  // Consulta del ítem si estamos editando
  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventario-item', id],
    queryFn: () => getInventarioByIdAction(id!),
    enabled: !isCreating,
  });

  // Estados del formulario
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'insumo' | 'compresor' | 'valvula' | 'equipo'>('insumo');
  const [condicion, setCondicion] = useState<string>('');
  const [stockMinimo, setStockMinimo] = useState<number | ''>(5);
  const [porcentajeIva, setPorcentajeIva] = useState<number | ''>(19);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number | ''>(30);
  const [idModelo, setIdModelo] = useState<number | ''>('');

  // Sincronizar datos al editar
  useEffect(() => {
    if (itemData) {
      setSku(itemData.sku || '');
      setNombre(itemData.nombre || '');
      setTipo(itemData.tipo || 'insumo');
      setCondicion(itemData.condicion || '');
      setStockMinimo(itemData.stock_minimo ?? 0);
      setPorcentajeIva(itemData.porcentaje_iva !== undefined && itemData.porcentaje_iva !== null ? Number(itemData.porcentaje_iva) : 19);
      setPorcentajeGanancia(itemData.porcentaje_ganancia !== undefined && itemData.porcentaje_ganancia !== null ? Number(itemData.porcentaje_ganancia) : 30);
      setIdModelo(itemData.id_modelo || '');
    }
  }, [itemData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idModelo) {
      toast.warning('Por favor selecciona un modelo');
      return;
    }

    if (!sku.trim()) {
      toast.warning('Por favor ingresa el SKU del ítem');
      return;
    }

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del ítem');
      return;
    }

    if (stockMinimo === '' || Number(stockMinimo) < 0) {
      toast.warning('Por favor ingresa un stock mínimo válido (mayor o igual a 0)');
      return;
    }

    if (porcentajeIva === '' || Number(porcentajeIva) < 0) {
      toast.warning('Por favor ingresa un porcentaje de IVA válido');
      return;
    }

    if (porcentajeGanancia === '' || Number(porcentajeGanancia) < 0) {
      toast.warning('Por favor ingresa un porcentaje de ganancia válido');
      return;
    }

    //validar condicion valida para tipo insumo y equipo
    if ((tipo === 'insumo' || tipo === 'equipo') && condicion !== 'NA') {
      toast.warning('Por favor ingresa "NA" como condicion para insumos y equipos');
      return;
    }

    //validar condiciones validas para tipo compresor y valvula
    if ((tipo === 'compresor' || tipo === 'valvula') && condicion === 'NA') {
      toast.warning('Por favor ingresa "nuevo" o "usado" como condicion para compresores y valvulas');
      return;
    }

    if (isCreating) {
      // Crear: id_modelo, sku, nombre, tipo, condicion, stock_minimo, porcentaje_iva y porcentaje_ganancia
      saveItem({
        payload: {
          id_modelo: Number(idModelo),
          sku: sku.trim().toUpperCase(),
          nombre: nombre.trim(),
          tipo,
          condicion,
          stock_minimo: Number(stockMinimo),
          porcentaje_iva: Number(porcentajeIva),
          porcentaje_ganancia: Number(porcentajeGanancia),
        },
        id: undefined,
      });
    } else {
      // Editar: solo editable sku, nombre, stock_minimo, porcentaje_iva y porcentaje_ganancia
      saveItem({
        payload: {
          sku: sku.trim().toUpperCase(),
          nombre: nombre.trim(),
          stock_minimo: Number(stockMinimo),
          porcentaje_iva: Number(porcentajeIva),
          porcentaje_ganancia: Number(porcentajeGanancia),
        },
        id,
      });
    }
  };

  if (!isCreating && isLoadingItem) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario/items"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Ítem de Inventario' : `Editar Ítem de Inventario #${id}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo artículo maestro al catálogo de inventario'
                : 'Modificación de parámetros editables del ítem maestro'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta del Formulario */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: SKU y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-blue-500" />
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: INS-ACE-001"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono uppercase font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                Nombre del Ítem <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Aceite Sintético ISO VG 46"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Fila 2: Tipo y Condición (Solo seleccionables al crear; al editar son informativos y no editables) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campo: Tipo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Tipo de Ítem
                {!isCreating && (
                  <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                    (No editable)
                  </span>
                )}
              </label>

              {isCreating ? (
                <select
                  value={tipo}
                  onChange={(e) => {
                    const newTipo = e.target.value as 'insumo' | 'compresor' | 'valvula' | 'equipo';
                    setTipo(newTipo);
                    if (newTipo === 'insumo') {
                      setCondicion('NA');
                    } else if (!condicion) {
                      setCondicion('nuevo');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer capitalize"
                  required
                >
                  <option value="insumo">Insumo</option>
                  <option value="compresor">Compresor</option>
                  <option value="valvula">Válvula</option>
                  <option value="equipo">Equipo</option>
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-sm font-bold text-foreground capitalize">
                    {tipo}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    El tipo de ítem maestro no puede ser alterado una vez registrado.
                  </p>
                </div>
              )}
            </div>

            {/* Campo: Condición */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Condición
                {!isCreating && (
                  <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                    (No editable)
                  </span>
                )}
              </label>

              {isCreating ? (

                <select
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer capitalize"
                >
                  <option value="NA">NA</option>
                  <option value="nuevo">Nuevo</option>
                  <option value="usado">Usado</option>
                </select>

              ) : (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-sm font-bold text-foreground uppercase">
                    {condicion}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    La condición del ítem no puede ser modificada en la edición.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fila 3: Modelo Técnico */}
          {isCreating && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Modelo Técnico Asociado
              </label>
              <select
                value={idModelo}
                onChange={(e) => setIdModelo(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Sin modelo asociado --</option>
                {modelos.map((m) => (
                  <option key={m.id_modelo} value={m.id_modelo}>
                    {m.nombre} {m.marca ? `(${m.marca.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fila 4: Parámetros Económicos y de Control (Siempre editables) */}
          <div className="pt-2 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              Parámetros de Stock y Finanzas
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* stock_minimo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Stock Mínimo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>

              {/* porcentaje_iva */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3 text-blue-500" />
                  Porcentaje IVA (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={porcentajeIva}
                  onChange={(e) => setPorcentajeIva(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>

              {/* porcentaje_ganancia */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-500" />
                  Porcentaje Ganancia (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={porcentajeGanancia}
                  onChange={(e) => setPorcentajeGanancia(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending
                ? 'Guardando...'
                : isCreating
                  ? 'Registrar Ítem'
                  : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormPage;
