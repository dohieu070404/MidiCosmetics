export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

export const ADMIN_ROLES = Object.freeze([USER_ROLES.ADMIN]);

export const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLES.ADMIN]: ['*'],
  // USER is kept in the enum only for compatibility with existing databases.
  // The current shop scope does not expose USER login, registration, comments, cart or orders.
  [USER_ROLES.USER]: [],
});

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];

export const hasPermission = (role, permission) => {
  const permissions = getPermissionsForRole(role);
  if (permissions.includes('*') || permissions.includes(permission)) return true;
  const [resource] = permission.split(':');
  return permissions.includes(`${resource}:*`);
};

export const canManageRole = (actorRole) => actorRole === USER_ROLES.ADMIN;
