export const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);

export const ensureSlug = (value, fallback = 'item') => slugify(value) || fallback;

export const buildUniqueSlug = async ({ base, model, existingUuid = null, field = 'slug' }) => {
  const root = ensureSlug(base);
  let candidate = root;
  let suffix = 1;

  while (true) {
    const found = await model.findFirst({
      where: {
        [field]: candidate,
        ...(existingUuid ? { uuid: { not: existingUuid } } : {}),
      },
      select: { id: true },
    });

    if (!found) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`.slice(0, 191);
  }
};
