import { NavLink, useNavigate } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { BrandLogo } from '@/components/brand/brand-logo';
import { ADMIN_NAVIGATION } from '@/constants/navigation';
import { authApi } from '@/lib/api/admin-api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const groupedNavigation = ADMIN_NAVIGATION.reduce((groups, item) => {
  const group = groups.find((entry) => entry.label === item.section);
  if (group) group.items.push(item);
  else groups.push({ label: item.section, items: [item] });
  return groups;
}, []);

export function AdminSidebar() {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((state) => state.logout);

  const logout = async () => {
    await authApi.logout().catch(() => null);
    logoutStore();
    navigate(ROUTE_PATHS.adminLogin, { replace: true });
  };

  return (
    <aside className="sticky top-0 hidden h-dvh overflow-y-auto border-r border-white/10 bg-[#241f1d] px-5 py-7 text-[#f7f0e7] lg:block">
      <div className="[&_a]:text-[#f7f0e7] [&_span]:text-[#bda89d]"><BrandLogo /></div>
      <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-[#aa958b]">Studio quản trị</p>
      <nav className="mt-8 grid gap-7" aria-label="Điều hướng quản trị">
        {groupedNavigation.map((group) => <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f7d75]">{group.label}</p>
          <div className="grid gap-0.5">{group.items.map((item) => (
            <NavLink key={item.href} to={item.href} end={item.href === ROUTE_PATHS.adminDashboard} className={({ isActive }) => cn('border-l border-transparent px-3 py-2 text-sm text-[#d6c7c0] transition duration-200 hover:border-[#d7aa9b] hover:bg-white/5 hover:text-white', isActive && 'border-[#d7aa9b] bg-white/8 text-white')}>
              {item.label}
            </NavLink>
          ))}</div>
        </div>)}
      </nav>
      <button type="button" onClick={logout} className="mt-8 w-full border border-white/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#d6c7c0] transition hover:bg-white/8 hover:text-white">
        Đăng xuất
      </button>
    </aside>
  );
}
