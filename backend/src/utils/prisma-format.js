export const publicUserSelect = Object.freeze({
  id: true,
  uuid: true,
  email: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  passwordChangedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const buildSearchWhere = (fields, search) => {
  if (!search) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    })),
  };
};

export const compactObject = (input) =>
  Object.entries(input).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});
