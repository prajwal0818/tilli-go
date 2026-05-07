import { Navigate, Outlet } from 'react-router-dom';

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (!parts[1]) return false;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    // Check expiry (exp is in seconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem('token');
    return false;
  }
}

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
