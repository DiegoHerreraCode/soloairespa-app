import { Link } from 'react-router';
import {
  ClipboardList,
  FileSpreadsheet,
  Users,
  ShoppingCart,
  Boxes,
  UserCog,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const DashboardPage = () => {
  const modules = [
    {
      title: 'Órdenes de Trabajo',
      description: 'Gestión y seguimiento de órdenes de servicio técnico y reparaciones.',
      to: '/admin/ordenes',
      icon: ClipboardList,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      controllers: 'OrdenController',
    },
    {
      title: 'Cotizaciones',
      description: 'Generación, aprobación, rechazo y control de presupuestos.',
      to: '/admin/cotizaciones',
      icon: FileSpreadsheet,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      controllers: 'CotizacionController',
    },
    {
      title: 'Clientes',
      description: 'Administración de clientes y registro de pagos recibidos.',
      to: '/admin/clientes',
      icon: Users,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      controllers: 'ClienteController, PagoClienteController',
    },
    {
      title: 'Compras',
      description: 'Control de compras a proveedores e historial de pagos de compras.',
      to: '/admin/compras',
      icon: ShoppingCart,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      controllers: 'CompraController, ProveedorController, PagoCompraController',
    },
    {
      title: 'Inventario',
      description: 'Control de repuestos, marcas, modelos, equipos, insumos y talleres.',
      to: '/admin/inventario',
      icon: Boxes,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      controllers: 'InventarioController, RepuestoController, EquipoController...',
    },
    {
      title: 'Personal',
      description: 'Gestión del equipo técnico, operadores y administradores.',
      to: '/admin/personal',
      icon: UserCog,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      controllers: 'AdminController, PersonalController',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado con mejor tipografía y contraste */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Panel de Control
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Módulos Disponibles
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Explora y gestiona los módulos operativos de Solo Aire SpA con precisión y agilidad.
        </p>
      </div>

      {/* Grid de tarjetas de módulos con bordes redondeados y micro-interacciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.to}
              className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/70 hover:border-primary/40 bg-card rounded-2xl flex flex-col justify-between overflow-hidden"
            >
              <CardHeader className="space-y-3 pb-3">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${m.color}`}
                >
                  <Icon size={24} />
                </div>
                <CardTitle className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {m.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {m.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 pb-5 border-t border-border/40 mt-3">
                <Link
                  to={m.to}
                  className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 gap-1.5 transition-all group-hover:gap-2.5"
                >
                  <span>Entrar al módulo</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
