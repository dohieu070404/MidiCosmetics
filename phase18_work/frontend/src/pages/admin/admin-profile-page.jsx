import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { authApi, adminApi } from '@/lib/api/admin-api';
import { useAuthStore } from '@/stores/auth-store';
import { ActionButton, Notice, PageHeader, SectionCard, TextInput, formatDate } from './admin-shared';

const INITIAL_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const INITIAL_VERIFY_FORM = { token: '' };

const PASSWORD_RULES = [
  'Ít nhất 10 ký tự',
  'Có chữ hoa và chữ thường',
  'Có số',
  'Có ký tự đặc biệt',
  'Không trùng mật khẩu hiện tại',
];

function readPayload(response) {
  return response?.data ?? response ?? {};
}

export function AdminProfilePage() {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((state) => state.logout);
  const storeUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [verifyForm, setVerifyForm] = useState(INITIAL_VERIFY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifyRequested, setVerifyRequested] = useState(false);

  const displayProfile = useMemo(() => profile || storeUser || {}, [profile, storeUser]);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.getProfile();
        const payload = readPayload(response);
        if (mounted) setProfile(payload.profile);
      } catch (err) {
        if (mounted) setError(err.message || 'Không tải được hồ sơ admin.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, []);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateVerifyForm = (event) => {
    const { name, value } = event.target;
    setVerifyForm((current) => ({ ...current, [name]: value }));
  };

  const requestChange = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu chưa khớp.');
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.requestPasswordChange({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage(response?.message || 'Vui lòng kiểm tra email để xác minh đổi mật khẩu.');
      setVerifyRequested(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message || 'Không gửi được yêu cầu đổi mật khẩu.');
    } finally {
      setSaving(false);
    }
  };

  const verifyChange = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setVerifying(true);
    try {
      const response = await adminApi.verifyPasswordChange({ token: verifyForm.token });
      setMessage(response?.message || 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.');
      setVerifyForm(INITIAL_VERIFY_FORM);
      await authApi.logout().catch(() => null);
      logoutStore();
      navigate(ROUTE_PATHS.adminLogin, { replace: true, state: { notice: 'Mật khẩu đã đổi thành công. Vui lòng đăng nhập lại.' } });
    } catch (err) {
      setError(err.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Tài khoản quản trị" description="Xem hồ sơ admin và đổi mật khẩu bằng mã xác minh qua email." />
      <Notice type="error">{error}</Notice>
      <Notice type="success">{message}</Notice>

      <SectionCard title="Thông tin tài khoản" description="Thông tin này chỉ dành cho admin đang đăng nhập.">
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-secondary/40 p-4"><dt className="text-muted-foreground">Email</dt><dd className="mt-1 font-medium">{displayProfile.email || '-'}</dd></div>
            <div className="rounded-2xl bg-secondary/40 p-4"><dt className="text-muted-foreground">Tên hiển thị</dt><dd className="mt-1 font-medium">{displayProfile.fullName || '-'}</dd></div>
            <div className="rounded-2xl bg-secondary/40 p-4"><dt className="text-muted-foreground">Role</dt><dd className="mt-1 font-medium">{displayProfile.role || '-'}</dd></div>
            <div className="rounded-2xl bg-secondary/40 p-4"><dt className="text-muted-foreground">Trạng thái</dt><dd className="mt-1 font-medium">{displayProfile.status || '-'}</dd></div>
            <div className="rounded-2xl bg-secondary/40 p-4"><dt className="text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-medium">{formatDate(displayProfile.createdAt)}</dd></div>
            <div className="rounded-2xl bg-secondary/40 p-4"><dt className="text-muted-foreground">Lần đăng nhập gần nhất</dt><dd className="mt-1 font-medium">{formatDate(displayProfile.lastLoginAt)}</dd></div>
          </dl>
        )}
      </SectionCard>

      <SectionCard title="Đổi mật khẩu" description="Mật khẩu chỉ được đổi sau khi nhập mã xác minh gửi tới email admin.">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="grid gap-4" onSubmit={requestChange}>
            <TextInput label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={updateForm} required />
            <TextInput label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={updateForm} required />
            <TextInput label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={updateForm} required />
            <ActionButton type="submit" disabled={saving}>{saving ? 'Đang gửi yêu cầu...' : 'Gửi mã xác minh qua email'}</ActionButton>
          </form>

          <div className="rounded-3xl border border-border bg-secondary/30 p-4">
            <h3 className="font-semibold">Yêu cầu mật khẩu mạnh</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              {PASSWORD_RULES.map((rule) => <li key={rule}>• {rule}</li>)}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Hệ thống không lưu mật khẩu thô. Mã xác minh hết hạn sau 15 phút và chỉ dùng được một lần.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Xác minh đổi mật khẩu" description="Nhập mã xác minh đã được gửi tới email admin. Sau khi đổi thành công, bạn cần đăng nhập lại.">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={verifyChange}>
          <TextInput label="Mã xác minh" name="token" value={verifyForm.token} onChange={updateVerifyForm} required disabled={!verifyRequested && !verifyForm.token} hint={!verifyRequested ? 'Gửi yêu cầu đổi mật khẩu trước, rồi nhập mã nhận được qua email.' : 'Dán mã xác minh từ email.'} />
          <div className="flex items-end"><ActionButton type="submit" disabled={verifying || (!verifyRequested && !verifyForm.token)}>{verifying ? 'Đang xác minh...' : 'Xác minh và đổi mật khẩu'}</ActionButton></div>
        </form>
      </SectionCard>
    </div>
  );
}
