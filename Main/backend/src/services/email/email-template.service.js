const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const EMAIL_TEMPLATE_TYPES = Object.freeze({
  ADMIN_PASSWORD_CHANGE_VERIFY: 'ADMIN_PASSWORD_CHANGE_VERIFY',
  ADMIN_PASSWORD_CHANGED: 'ADMIN_PASSWORD_CHANGED',
  NOTIFICATION_EMAIL_VERIFY: 'NOTIFICATION_EMAIL_VERIFY',
  NOTIFICATION_EMAIL_TEST: 'NOTIFICATION_EMAIL_TEST',
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_PRICE_CHANGED: 'PRODUCT_PRICE_CHANGED',
  PRODUCT_STATUS_CHANGED: 'PRODUCT_STATUS_CHANGED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  IMPORT_COMPLETED: 'IMPORT_COMPLETED',
  ADMIN_BOOTSTRAPPED: 'ADMIN_BOOTSTRAPPED',
});

const SUBJECTS = Object.freeze({
  [EMAIL_TEMPLATE_TYPES.ADMIN_PASSWORD_CHANGE_VERIFY]: '[Midi Cosmetics] Xác minh đổi mật khẩu quản trị',
  [EMAIL_TEMPLATE_TYPES.ADMIN_PASSWORD_CHANGED]: '[Midi Cosmetics] Mật khẩu quản trị đã được thay đổi',
  [EMAIL_TEMPLATE_TYPES.NOTIFICATION_EMAIL_VERIFY]: '[Midi Cosmetics] Xác minh email nhận thông báo',
  [EMAIL_TEMPLATE_TYPES.NOTIFICATION_EMAIL_TEST]: '[Midi Cosmetics] Email test thông báo hệ thống',
  [EMAIL_TEMPLATE_TYPES.PRODUCT_CREATED]: '[Midi Cosmetics] Sản phẩm vừa được thêm',
  [EMAIL_TEMPLATE_TYPES.PRODUCT_UPDATED]: '[Midi Cosmetics] Sản phẩm vừa được chỉnh sửa',
  [EMAIL_TEMPLATE_TYPES.PRODUCT_PRICE_CHANGED]: '[Midi Cosmetics] Giá sản phẩm vừa được thay đổi',
  [EMAIL_TEMPLATE_TYPES.PRODUCT_STATUS_CHANGED]: '[Midi Cosmetics] Sản phẩm vừa được chỉnh sửa',
  [EMAIL_TEMPLATE_TYPES.PRODUCT_DELETED]: '[Midi Cosmetics] Sản phẩm vừa bị xóa hoặc ẩn',
  [EMAIL_TEMPLATE_TYPES.IMPORT_COMPLETED]: '[Midi Cosmetics] Import Excel vừa hoàn tất',
  [EMAIL_TEMPLATE_TYPES.ADMIN_BOOTSTRAPPED]: '[Midi Cosmetics] Admin đầu tiên vừa được tạo',
});

export const formatEmailDateTime = (value = new Date()) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(value instanceof Date ? value : new Date(value));

const normalizeRows = (rows = []) => rows
  .filter(Boolean)
  .filter((row) => row.value !== undefined && row.value !== null && row.value !== '')
  .map((row) => ({ label: String(row.label || ''), value: String(row.value ?? '') }));

const renderRowsHtml = (rows) => rows.map((row) => `
  <tr>
    <td style="padding:8px 12px;border:1px solid #eee;background:#faf7f2;font-weight:600;vertical-align:top;width:180px;">${escapeHtml(row.label)}</td>
    <td style="padding:8px 12px;border:1px solid #eee;">${escapeHtml(row.value)}</td>
  </tr>
`).join('');

const renderRowsText = (rows) => rows.map((row) => `${row.label}: ${row.value}`).join('\n');

export const emailTemplateService = {
  getSubject(type, fallback = '[Midi Cosmetics] Thông báo hệ thống') {
    return SUBJECTS[type] || fallback;
  },

  build({ type, title, rows = [] }) {
    const subject = this.getSubject(type, title);
    const safeTitle = title || subject;
    const normalizedRows = normalizeRows([
      { label: 'Thời gian', value: formatEmailDateTime() },
      ...rows,
    ]);

    const text = [
      'Midi Cosmetics',
      '',
      safeTitle,
      '',
      renderRowsText(normalizedRows),
      '',
      'Email này được gửi tự động từ hệ thống Midi Cosmetics.',
    ].join('\n');

    const html = `
      <div style="margin:0;padding:0;background:#f7f1e8;color:#2a2420;font-family:Arial,Tahoma,sans-serif;line-height:1.6;">
        <div style="max-width:720px;margin:0 auto;padding:24px;">
          <div style="background:#fff;border:1px solid #eadfce;border-radius:18px;padding:24px;">
            <div style="font-size:20px;font-weight:700;letter-spacing:0.04em;margin-bottom:10px;">Midi Cosmetics</div>
            <h1 style="font-size:22px;line-height:1.3;margin:0 0 18px;color:#3a2d25;">${escapeHtml(safeTitle)}</h1>
            <table style="border-collapse:collapse;width:100%;font-size:14px;">${renderRowsHtml(normalizedRows)}</table>
            <p style="margin-top:18px;color:#7a6d63;font-size:12px;">Email này được gửi tự động từ hệ thống Midi Cosmetics.</p>
          </div>
        </div>
      </div>
    `;

    return { subject, text, html };
  },
};
