export const getIpAddress = (req) => req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null;
export const getUserAgent = (req) => req.headers['user-agent'] || null;
