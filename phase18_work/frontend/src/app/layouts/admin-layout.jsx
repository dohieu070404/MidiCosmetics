import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { ADMIN_NAVIGATION } from '@/constants/navigation';
import { authApi } from '@/lib/api/admin-api';
import { useAuthStore } from '@/stores/auth-store';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const logoutStore = useAuthStore((state) => state.logout);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const readPayload = (response) => response?.data ?? response ?? {};

    const verifySession = async () => {
      setChecking(true);
      try {
        if (accessToken) {
          const response = await authApi.me();
          const payload = readPayload(response);
          if (mounted) setSession({ user: payload.user, tokens: { accessToken } });
          return;
        }

        const response = await authApi.refresh();
        const payload = readPayload(response);
        if (mounted) setSession({ user: payload.user, tokens: payload.tokens });
      } catch {
        if (mounted) logoutStore();
      } finally {
        if (mounted) setChecking(false);
      }
    };

    verifySession();
    return () => { mounted = false; };
  }, [accessToken, logoutStore, setSession]);

  const logout = async () => {
    await authApi.logout().catch(() => null);
    logoutStore();
    navigate(ROUTE_PATHS.adminLogin, { replace: true });
  };

  if (checking) return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Đang kiểm tra đăng nhập...</div>;
  if (!accessToken || user?.role !== 'ADMIN') return <Navigate to={ROUTE_PATHS.adminLogin} replace state={{ from: location }} />;

  return (
    <div className="min-h-dvh bg-secondary/30">
      <div className="grid min-h-dvh lg:grid-cols-[17rem_minmax(0,1fr)]">
        <AdminSidebar />
        <main className="min-w-0 p-3 sm:p-5 lg:p-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] border border-border bg-background p-3 shadow-sm sm:rounded-[2rem] sm:p-5 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quản trị</p>
                  <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Midi Cosmetics</h1>
                  <p className="text-sm text-muted-foreground">{user.fullName} · Admin</p>
                </div>
                <button type="button" onClick={logout} className="w-fit rounded-2xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary lg:hidden">Đăng xuất</button>
              </div>
              <nav className="flex snap-x gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="Điều hướng quản trị trên di động">
                {ADMIN_NAVIGATION.map((item) => <Link key={item.href} to={item.href} className="snap-start whitespace-nowrap rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary">{item.label}</Link>)}
              </nav>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
