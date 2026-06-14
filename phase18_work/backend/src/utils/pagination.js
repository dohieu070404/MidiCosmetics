export const buildPagination = ({ page = 1, limit = 20, total = 0 }) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const getPaginationArgs = ({ page = 1, limit = 20 }) => ({
  skip: (page - 1) * limit,
  take: limit,
});
