import { NavLink, useNavigate } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { BrandLogo } from '@/components/brand/brand-logo';
import { ADMIN_NAVIGATION } from '@/constants/navigation';
import { authApi } from '@/lib/api/admin-api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export function AdminSidebar() {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((state) => state.logout);

  const logout = async () => {
    await authApi.logout().catch(() => null);
    logoutStore();
    navigate(ROUTE_PATHS.adminLogin, { replace: true });
  };

  return (
    <aside className="hidden border-r border-border bg-card/80 p-5 lg:block">
      <BrandLogo />
      <nav className="mt-10 grid gap-2" aria-label="Điều hướng quản trị">
        {ADMIN_NAVIGATION.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === ROUTE_PATHS.adminDashboard}
            className={({ isActive }) =>
              cn(
                'rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                isActive && 'bg-secondary text-foreground'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" onClick={logout} className="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
        Đăng xuất
      </button>
    </aside>
  );
}
