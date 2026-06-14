import crypto from 'node:crypto';

export const requestId = (req, res, next) => {
  const incomingRequestId = req.headers['x-request-id'];
  req.id = Array.isArray(incomingRequestId) ? incomingRequestId[0] : incomingRequestId || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};
