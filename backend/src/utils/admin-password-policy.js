export const ADMIN_PASSWORD_POLICY_MESSAGE = 'Password must be at least 10 characters and include uppercase, lowercase, number and special character';

export const isStrongAdminPassword = (password) => {
  if (typeof password !== 'string') return false;
  return password.length >= 10
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
};
