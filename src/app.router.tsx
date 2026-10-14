import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { RegisterPage } from './auth/pages/register/RegisterPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { AuthenticatedRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes';

// Lazy loading del AuthLayout
const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));

export const appRouter = createBrowserRouter([
  // Ruta principal (Protegida: solo para usuarios autenticados)
  {
    path: '/',
    element: (
      <AuthenticatedRoute>
        <HomePage />
      </AuthenticatedRoute>
    ),
  },

  // Rutas de autenticación (Solo para no autenticados)
  {
    path: '/auth',
    element: (
      <NotAuthenticatedRoute>
        <AuthLayout />
      </NotAuthenticatedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Comodín / 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
