const safeDecodeURIComponent = (value = '') => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const cookieParser = (req, res, next) => {
  const header = req.headers.cookie;
  req.cookies = {};
  if (header) {
    for (const pair of header.split(';')) {
      const index = pair.indexOf('=');
      if (index > -1) {
        const key = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();
        req.cookies[key] = safeDecodeURIComponent(value);
      }
    }
  }
  next();
};
