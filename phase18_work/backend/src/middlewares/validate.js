import { ApiError } from '../errors/api-error.js';

const formatZodIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join('.') || null,
    code: issue.code,
    message: issue.message,
  }));

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
  });

  if (!result.success) {
    return next(ApiError.unprocessable('Validation failed', formatZodIssues(result.error.issues)));
  }

  req.validated = result.data;
  return next();
};
