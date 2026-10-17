import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { RegisterPage } from './auth/pages/register/RegisterPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { DashboardPage } from './admin/pages/dashboard/DashboardPage';
import { FinanzasPage } from './admin/pages/finanzas/FinanzasPage';
import { PersonalMenuPage } from './admin/pages/personal/PersonalMenuPage';
import { PersonalTallerPage } from './admin/pages/personal/PersonalTallerPage';
import { PersonalTallerFormPage } from './admin/pages/personal/PersonalTallerFormPage';
import { AdministradoresPage } from './admin/pages/personal/AdministradoresPage';
import { AdministradoresFormPage } from './admin/pages/personal/AdministradoresFormPage';
import { ClienteMenuPage } from './admin/pages/clientes/ClienteMenuPage';
import { ClientePage } from './admin/pages/clientes/ClientePage';
import { ClienteFormPage } from './admin/pages/clientes/ClienteFormPage';
import { PagoClientePage } from './admin/pages/clientes/PagoClientePage';
import { PagoClienteFormPage } from './admin/pages/clientes/PagoClienteFormPage';
import { ModulePlaceholder } from './admin/pages/ModulePlaceholder';
import { AuthenticatedRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes';

// Lazy loading de layouts
const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));

export const appRouter = createBrowserRouter([
  // Redirección de raíz hacia el panel de administración
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },

  // Rutas públicas de autenticación (solo para usuarios no autenticados)
  {
    path: '/auth',
    element: (
      <NotAuthenticatedRoute>
        <AuthLayout />
      </NotAuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: auth
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login', // ruta: auth/login
        element: <LoginPage />,
      },
      {
        path: 'register', // ruta: auth/register
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password', // ruta: auth/forgot-password
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Rutas privadas de administración (requieren autenticación)
  {
    path: '/admin',
    element: (
      <AuthenticatedRoute>
        <AdminLayout />
      </AuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: admin
        element: <DashboardPage />,
      },
      {
        path: 'ordenes', // ruta: admin/ordenes
        element: (
          <ModulePlaceholder
            title="Órdenes de Trabajo"
            description="Gestión y estado de órdenes mediante OrdenController."
          />
        ),
      },
      {
        path: 'cotizaciones', // ruta: admin/cotizaciones
        element: (
          <ModulePlaceholder
            title="Cotizaciones"
            description="Aprobación y control de presupuestos mediante CotizacionController."
          />
        ),
      },
      {
        path: 'clientes',
        children: [
          {
            index: true, // ruta: admin/clientes (Menú de selección con los 2 cards: Clientes y Pagos)
            element: <ClienteMenuPage />,
          },
          {
            path: 'listado', // ruta: admin/clientes/listado (Listado de clientes)
            element: <ClientePage />,
          },
          {
            path: 'listado/:id', // ruta: admin/clientes/listado/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <ClienteFormPage />,
          },
          {
            path: 'pagos-clientes', // ruta: admin/clientes/pagos-clientes (Listado con tabla)
            element: <PagoClientePage />,
          },
          {
            path: 'pagos-clientes/:id', // ruta: admin/clientes/pagos-clientes/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PagoClienteFormPage />,
          },
        ],
      },
      {
        path: 'compras', // ruta: admin/compras
        element: (
          <ModulePlaceholder
            title="Compras y Proveedores"
            description="Control de proveedores, compras y pagos."
          />
        ),
      },
      {
        path: 'inventario', // ruta: admin/inventario
        element: (
          <ModulePlaceholder
            title="Inventario y Servicios"
            description="Control de repuestos, marcas, modelos, insumos, reparaciones y equipos."
          />
        ),
      },
      {
        path: 'personal',
        children: [
          {
            index: true, // ruta: admin/personal (Menú de selección con los 2 cards)
            element: <PersonalMenuPage />,
          },
          {
            path: 'taller', // ruta: admin/personal/taller (Listado con tarjetas)
            element: <PersonalTallerPage />,
          },
          {
            path: 'taller/:id', // ruta: admin/personal/taller/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PersonalTallerFormPage />,
          },
          {
            path: 'administradores', // ruta: admin/personal/administradores (Listado con tarjetas)
            element: <AdministradoresPage />,
          },
          {
            path: 'administradores/:id', // ruta: admin/personal/administradores/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <AdministradoresFormPage />,
          },
        ],
      },
      {
        path: 'finanzas', // ruta: admin/finanzas
        element: <FinanzasPage />,
      },
    ],
  },

  // Comodín / 404
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
