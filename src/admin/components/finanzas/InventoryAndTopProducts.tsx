import { Boxes, Award, PackageCheck } from 'lucide-react';

interface TopProductItem {
  nombre: string;
  unidades: number;
}

interface Props {
  totalInventoryValue: number;
  totalInventoryUnits: number;
  topInsumo?: TopProductItem;
  topCompresor?: TopProductItem;
  topValvula?: TopProductItem;
}

export const InventoryAndTopProducts = ({
  totalInventoryValue,
  totalInventoryUnits,
  topInsumo,
  topCompresor,
  topValvula,
}: Props) => {
  return (
    <div className="space-y-6">
      {/* Tarjeta: Valor Total del Inventario */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Boxes size={16} />
          <span>Valor Total del Inventario</span>
        </div>
        <p className="text-3xl font-extrabold text-foreground tracking-tight">
          ${Math.round(totalInventoryValue).toLocaleString('es-CL')}
        </p>
        <p className="text-xs text-muted-foreground">
          Valorizado a monto de venta unitario ({totalInventoryUnits} unidades en stock)
        </p>
      </div>

      {/* Tarjeta: Productos Top del Negocio (Insumo, Compresor y Válvula más vendidos) */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
          <Award size={16} />
          <span>Productos Top del Negocio</span>
        </div>

        <div className="space-y-3.5 divide-y divide-border/60">
          {/* Insumo más vendido */}
          <div className="pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Insumo Más Vendido:
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PackageCheck size={16} className="text-primary shrink-0" />
                <p className="text-sm font-bold text-foreground truncate">
                  {topInsumo ? topInsumo.nombre : 'Sin ventas registradas'}
                </p>
              </div>
              {topInsumo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {topInsumo.unidades} unid.
                </span>
              )}
            </div>
          </div>

          {/* Compresor más vendido */}
          <div className="pt-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Compresor Más Vendido:
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PackageCheck size={16} className="text-cyan-500 shrink-0" />
                <p className="text-sm font-bold text-foreground truncate">
                  {topCompresor ? topCompresor.nombre : 'Sin ventas registradas'}
                </p>
              </div>
              {topCompresor && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                  {topCompresor.unidades} unid.
                </span>
              )}
            </div>
          </div>

          {/* Válvula más vendida */}
          <div className="pt-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Válvula Más Vendida:
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PackageCheck size={16} className="text-amber-500 shrink-0" />
                <p className="text-sm font-bold text-foreground truncate">
                  {topValvula ? topValvula.nombre : 'Sin ventas registradas'}
                </p>
              </div>
              {topValvula && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                  {topValvula.unidades} unid.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
