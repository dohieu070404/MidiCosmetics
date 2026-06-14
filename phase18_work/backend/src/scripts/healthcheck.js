import http from 'node:http';

const port = process.env.PORT || 8080;
const options = {
  host: '127.0.0.1',
  port,
  path: '/health',
  timeout: 3000,
};

const req = http.get(options, (res) => {
  if (res.statusCode >= 200 && res.statusCode < 300) {
    process.exit(0);
  }
  process.exit(1);
});

req.on('error', () => process.exit(1));
req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});
