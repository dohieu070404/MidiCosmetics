import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin-api';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import {
  AdminTable,
  Notice,
  PageHeader,
  SectionCard,
  StatusBadge,
  formatDate,
} from './admin-shared';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const requests = [
      adminApi.dashboard(),
      adminApi.listQuotes({ limit: 1, status: 'CREATED' }),
      adminApi.listQuotes({ limit: 1, status: 'MESSENGER_OPENED' }),
      adminApi.listQuotes({ limit: 1, status: 'PROCESSED' }),
      adminApi.interestAnalytics({}),
    ];

    Promise.allSettled(requests).then((results) => {
      if (!active) return;

      const [dashboard, newQuotes, openedQuotes, processedQuotes, interest] = results;
      if (dashboard.status === 'rejected') {
        setError(
          `Không thể tải dữ liệu tổng quan: ${dashboard.reason?.message || 'API không phản hồi.'}`,
        );
        setLoading(false);
        return;
      }

      const responseCount = (result) =>
        result.status === 'fulfilled'
          ? (result.value.meta?.total ?? result.value.data?.quotes?.length ?? 0)
          : 0;
      const unavailable = [
        ['phiếu mới', newQuotes],
        ['phiếu đã mở Messenger', openedQuotes],
        ['phiếu đã xử lý', processedQuotes],
        ['phân tích mức quan tâm', interest],
      ].filter(([, result]) => result.status === 'rejected');

      setData({
        ...dashboard.value.data,
        newQuotes: responseCount(newQuotes),
        openedQuotes: responseCount(openedQuotes),
        processedQuotes: responseCount(processedQuotes),
        interest: interest.status === 'fulfilled' ? interest.value.data : null,
      });
      setError(
        unavailable.length
          ? `Đã tải phần chính. Tạm thời chưa tải được: ${unavailable.map(([label]) => label).join(', ')}. Hãy chạy Prisma migrations trên database production rồi tải lại trang.`
          : '',
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    const counters = data?.counters || {};
    return [
      { label: 'Sản phẩm đang hiển thị', value: counters.activeProducts || 0 },
      { label: 'Bài viết đã đăng', value: counters.publishedPosts || 0 },
      { label: 'Sản phẩm đề xuất', value: counters.featuredProducts || 0 },
      { label: 'Bài viết đề xuất', value: counters.featuredPosts || 0 },
      { label: 'Ảnh đã tải', value: counters.mediaAssets || 0 },
      { label: 'Báo giá mới', value: data?.newQuotes || 0 },
      { label: 'Đã mở Messenger', value: data?.openedQuotes || 0 },
      { label: 'Phiếu đã xử lý', value: data?.processedQuotes || 0 },
    ];
  }, [data]);

  const quickActions = [
    { label: 'Thêm sản phẩm', href: ROUTE_PATHS.adminProducts, primary: true },
    { label: 'Import Excel', href: ROUTE_PATHS.adminImport },
    { label: 'Viết bài blog', href: ROUTE_PATHS.adminPosts },
    { label: 'Xử lý báo giá', href: ROUTE_PATHS.adminQuotes },
    { label: 'Cài đặt email thông báo', href: ROUTE_PATHS.adminNotificationRecipients },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi nội dung, sản phẩm và tín hiệu khách cần tư vấn trong một nơi."
        actions={quickActions.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${item.primary ? 'bg-primary text-primary-foreground hover:-translate-y-0.5' : 'border border-border hover:border-primary hover:text-primary'}`}
          >
            {item.label}
          </Link>
        ))}
      />
      <Notice type={data ? 'info' : 'error'}>{error}</Notice>
      {loading ? <div className="h-48 animate-pulse rounded-3xl bg-secondary" /> : null}
      {!loading && !data ? (
        <SectionCard title="Chưa thể tải dashboard">
          <p className="text-sm leading-7 text-muted-foreground">
            Kiểm tra kết nối API, đăng nhập quản trị và trạng thái migration của database
            production.
          </p>
        </SectionCard>
      ) : null}
      {data ? (
        <>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {cards.map((card) => (
              <div key={card.label} className="bg-card p-5 transition-colors hover:bg-secondary/40">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard title="Import gần nhất">
              {data.latestImport ? (
                <div className="grid gap-2 text-sm leading-7">
                  <p>
                    <strong>Tệp:</strong> {data.latestImport.originalName || '-'}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{' '}
                    <StatusBadge>{data.latestImport.status}</StatusBadge>
                  </p>
                  <p>
                    <strong>Kết quả:</strong> {data.latestImport.successRows || 0} thành công ·{' '}
                    {data.latestImport.failedRows || 0} lỗi / {data.latestImport.totalRows || 0}{' '}
                    dòng
                  </p>
                  <p>
                    <strong>Ngày:</strong> {formatDate(data.latestImport.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có lần import nào.</p>
              )}
            </SectionCard>
            <SectionCard title="Bài viết gần đây" className="lg:col-span-1">
              <AdminTable
                columns={[
                  { key: 'title', label: 'Tiêu đề' },
                  {
                    key: 'status',
                    label: 'Trạng thái',
                    render: (r) => <StatusBadge>{r.status}</StatusBadge>,
                  },
                ]}
                rows={data.recent?.posts || []}
              />
            </SectionCard>
            <SectionCard title="Sản phẩm gần đây" className="lg:col-span-1">
              <AdminTable
                columns={[
                  { key: 'name', label: 'Tên' },
                  {
                    key: 'status',
                    label: 'Trạng thái',
                    render: (r) => <StatusBadge>{r.status}</StatusBadge>,
                  },
                ]}
                rows={data.recent?.products || []}
              />
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
