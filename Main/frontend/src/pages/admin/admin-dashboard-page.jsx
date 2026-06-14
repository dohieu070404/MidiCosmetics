import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin-api';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { AdminTable, Notice, PageHeader, SectionCard, StatusBadge, formatDate } from './admin-shared';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.dashboard().then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, []);

  const cards = useMemo(() => {
    const counters = data?.counters || {};
    return [
      { label: 'Sản phẩm đang hiển thị', value: counters.activeProducts || 0 },
      { label: 'Bài viết đã đăng', value: counters.publishedPosts || 0 },
      { label: 'Sản phẩm đề xuất', value: counters.featuredProducts || 0 },
      { label: 'Bài viết đề xuất', value: counters.featuredPosts || 0 },
      { label: 'Ảnh đã tải', value: counters.mediaAssets || 0 },
    ];
  }, [data]);

  const quickActions = [
    { label: 'Thêm sản phẩm', href: ROUTE_PATHS.adminProducts, primary: true },
    { label: 'Import Excel', href: ROUTE_PATHS.adminImport },
    { label: 'Viết bài blog', href: ROUTE_PATHS.adminPosts },
    { label: 'Cài đặt email thông báo', href: ROUTE_PATHS.adminNotificationRecipients },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Tổng quan" description="Theo dõi nhanh sản phẩm, bài viết đề xuất và các lần import gần nhất." actions={quickActions.map((item) => <Link key={item.href} to={item.href} className={`rounded-2xl px-4 py-2 text-sm font-medium ${item.primary ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>{item.label}</Link>)} />
      <Notice>{error}</Notice>
      {!data ? <div className="h-48 animate-pulse rounded-3xl bg-secondary" /> : null}
      {data ? <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Import gần nhất">
            {data.latestImport ? <div className="grid gap-2 text-sm leading-7">
              <p><strong>Tệp:</strong> {data.latestImport.originalName || '-'}</p>
              <p><strong>Trạng thái:</strong> <StatusBadge>{data.latestImport.status}</StatusBadge></p>
              <p><strong>Kết quả:</strong> {data.latestImport.successRows || 0} thành công · {data.latestImport.failedRows || 0} lỗi / {data.latestImport.totalRows || 0} dòng</p>
              <p><strong>Ngày:</strong> {formatDate(data.latestImport.createdAt)}</p>
            </div> : <p className="text-sm text-muted-foreground">Chưa có lần import nào.</p>}
          </SectionCard>
          <SectionCard title="Bài viết gần đây" className="lg:col-span-1"><AdminTable columns={[{ key: 'title', label: 'Tiêu đề' }, { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> }]} rows={data.recent?.posts || []} /></SectionCard>
          <SectionCard title="Sản phẩm gần đây" className="lg:col-span-1"><AdminTable columns={[{ key: 'name', label: 'Tên' }, { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> }]} rows={data.recent?.products || []} /></SectionCard>
        </div>
      </> : null}
    </div>
  );
}
