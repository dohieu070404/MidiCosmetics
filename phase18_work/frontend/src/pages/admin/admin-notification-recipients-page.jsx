import { useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/api/admin-api';
import { ActionButton, DangerButton, Notice, PageHeader, SecondaryButton, SectionCard, StatusBadge, TextInput, formatDate } from './admin-shared';

const INITIAL_ADD_FORM = { email: '' };
const INITIAL_VERIFY_FORM = { token: '' };

const readPayload = (response) => response?.data ?? response ?? {};

export function AdminNotificationRecipientsPage() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_ADD_FORM);
  const [verifyForm, setVerifyForm] = useState(INITIAL_VERIFY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const verifiedActiveCount = useMemo(() => recipients.filter((item) => item.isVerified && item.isActive).length, [recipients]);

  const loadRecipients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.listNotificationRecipients();
      const payload = readPayload(response);
      setRecipients(payload.recipients || []);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách email thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.listNotificationRecipients();
        const payload = readPayload(response);
        if (mounted) setRecipients(payload.recipients || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Không tải được danh sách email thông báo.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const addRecipient = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await adminApi.createNotificationRecipient({ email: addForm.email });
      setMessage(response?.message || 'Email đã được thêm. Vui lòng kiểm tra email để lấy mã xác minh.');
      setAddForm(INITIAL_ADD_FORM);
      await loadRecipients();
    } catch (err) {
      setError(err.message || 'Không thêm được email nhận thông báo.');
    } finally {
      setSaving(false);
    }
  };

  const verifyRecipient = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await adminApi.verifyNotificationRecipient({ token: verifyForm.token });
      setMessage(response?.message || 'Email nhận thông báo đã được xác minh.');
      setVerifyForm(INITIAL_VERIFY_FORM);
      await loadRecipients();
    } catch (err) {
      setError(err.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRecipient = async (recipient) => {
    setError('');
    setMessage('');
    try {
      const response = await adminApi.toggleNotificationRecipient(recipient.uuid);
      setMessage(response?.message || 'Đã cập nhật trạng thái email.');
      await loadRecipients();
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái email.');
    }
  };

  const deleteRecipient = async (recipient) => {
    if (!window.confirm(`Xóa email nhận thông báo ${recipient.email}?`)) return;
    setError('');
    setMessage('');
    try {
      const response = await adminApi.deleteNotificationRecipient(recipient.uuid);
      setMessage(response?.message || 'Email nhận thông báo đã được xóa.');
      await loadRecipients();
    } catch (err) {
      setError(err.message || 'Không xóa được email nhận thông báo.');
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError('');
    setMessage('');
    try {
      const response = await adminApi.sendNotificationRecipientTest();
      setMessage(response?.message || 'Email test đã được gửi thành công.');
    } catch (err) {
      setError(err.message || 'Không gửi được email test. Vui lòng kiểm tra SMTP và email đã xác minh.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Email thông báo" description="Quản lý danh sách email nhận cảnh báo khi admin thay đổi sản phẩm, import Excel hoặc đổi mật khẩu." />
      <Notice type="error">{error}</Notice>
      <Notice type="success">{message}</Notice>

      <SectionCard title="Thêm email nhận thông báo" description="Email mới phải được xác minh trước khi nhận thông báo hệ thống.">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={addRecipient}>
          <TextInput label="Email nhận thông báo" type="email" name="email" value={addForm.email} onChange={(event) => setAddForm({ email: event.target.value })} required hint="Không hiển thị SMTP secret trong giao diện quản trị." />
          <div className="flex items-end"><ActionButton type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm email'}</ActionButton></div>
        </form>
      </SectionCard>

      <SectionCard title="Xác minh email" description="Dán mã xác minh được gửi tới email nhận thông báo.">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={verifyRecipient}>
          <TextInput label="Mã xác minh" name="token" value={verifyForm.token} onChange={(event) => setVerifyForm({ token: event.target.value })} required />
          <div className="flex items-end"><ActionButton type="submit" disabled={saving}>{saving ? 'Đang xác minh...' : 'Xác minh email'}</ActionButton></div>
        </form>
      </SectionCard>

      <SectionCard
        title="Danh sách email nhận thông báo"
        description={`${verifiedActiveCount} email đã xác minh và đang bật sẽ nhận thông báo hệ thống.`}
        actions={<SecondaryButton type="button" onClick={sendTest} disabled={testing || verifiedActiveCount === 0}>{testing ? 'Đang gửi...' : 'Gửi email test'}</SecondaryButton>}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải danh sách email...</p>
        ) : recipients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Chưa có email nhận thông báo nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Xác minh</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Ngày tạo</th>
                  <th className="px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.uuid} className="border-t border-border">
                    <td className="px-3 py-3 font-medium">{recipient.email}</td>
                    <td className="px-3 py-3"><StatusBadge>{recipient.isVerified ? 'VALID' : 'PENDING'}</StatusBadge></td>
                    <td className="px-3 py-3"><StatusBadge>{recipient.isActive ? 'ACTIVE' : 'INACTIVE'}</StatusBadge></td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(recipient.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => toggleRecipient(recipient)} disabled={!recipient.isVerified}>{recipient.isActive ? 'Tắt' : 'Bật'}</SecondaryButton>
                        <DangerButton type="button" onClick={() => deleteRecipient(recipient)}>Xóa</DangerButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
