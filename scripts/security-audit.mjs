import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const includeHistory = process.argv.includes('--history');
const findings = [];
const placeholder =
  /(?:^$|change[_ -]?me|replace|placeholder|example|dummy|sample|project_ref|url_encoded|username|password|region|cloud_name|api_key|api_secret|<[^>]+>|\$\{|process\.env)/i;
const localOnly = /(?:localhost|127\.0\.0\.1|@database:|midi_(?:local|dev)|local[_-]|admin@123)/i;

const strongRules = [
  ['PRIVATE_KEY', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['AWS_ACCESS_KEY', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GITHUB_TOKEN', /\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['SLACK_TOKEN', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['JWT_LITERAL', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
];

const sensitiveKey =
  /^(?:POSTGRES_PASSWORD|DATABASE_URL|DIRECT_URL|JWT_ACCESS_SECRET|JWT_REFRESH_SECRET|DEV_ADMIN_PASSWORD|ADMIN_BOOTSTRAP_TOKEN|RECAPTCHA_SECRET_KEY|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET|SMTP_PASS|PRIVATE_KEY|API_SECRET)$/i;
const forbiddenPath =
  /(?:^|\/)(?:\.env|\.env\.(?!.*\.example$)[^/]+|id_rsa|credentials\.json|secrets?\.ya?ml)$|\.(?:pem|key|p12|pfx|jks|keystore)$/i;
const allowedEnvExample = /(?:^|\/)\.env(?:\.[^/]+)?\.example$|(?:^|\/)\.env\.example$/i;
const isConfigFile = (path) =>
  /(?:^|\/)\.env(?:\.|$)|\.(?:ya?ml|toml|ini|conf)$/i.test(path) ||
  /(?:^|\/)Dockerfile$/i.test(path);

// If ignored local environment files exist, use their configured secret values
// as private signatures. This catches an exact value copied into source or Git
// history without ever printing the value itself.
const localEnvironmentPaths = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.docker.local',
  'backend/.env',
  'backend/.env.local',
  'backend/.env.production',
  'frontend/.env',
  'frontend/.env.local',
  'frontend/.env.production',
];
const knownLocalSecrets = [];
for (const environmentPath of localEnvironmentPaths) {
  if (!existsSync(environmentPath)) continue;
  const content = readFileSync(environmentPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const assignment = rawLine.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!assignment || !sensitiveKey.test(assignment[1])) continue;
    const value = assignment[2].replace(/^['"]|['"]$/g, '').trim();
    if (value.length >= 8 && !placeholder.test(value)) {
      knownLocalSecrets.push({ key: assignment[1].toUpperCase(), value });
    }
  }
}

const runGit = (args) => {
  const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout;
};

const report = (scope, path, line, rule) => findings.push({ scope, path, line, rule });

const scanLine = (line, scope, path, lineNumber, { genericAssignments = true } = {}) => {
  for (const secret of knownLocalSecrets) {
    if (line.includes(secret.value))
      report(scope, path, lineNumber, `KNOWN_LOCAL_SECRET_${secret.key}`);
  }

  for (const [rule, pattern] of strongRules) {
    if (pattern.test(line) && !placeholder.test(line)) report(scope, path, lineNumber, rule);
  }

  const credentialUri = line.match(
    /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp|cloudinary):\/\/[^\s/:]+:([^\s@/]+)@([^\s/?#]+)/i,
  );
  if (credentialUri && !placeholder.test(credentialUri[1]) && !localOnly.test(line)) {
    report(scope, path, lineNumber, 'CREDENTIAL_IN_URI');
  }

  if (!genericAssignments) return;
  const assignment = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*[:=]\s*(.*?)\s*$/);
  if (assignment && sensitiveKey.test(assignment[1])) {
    const value = assignment[2].replace(/^['"]|['"]$/g, '').trim();
    if (value && !placeholder.test(value) && !localOnly.test(value)) {
      report(scope, path, lineNumber, `HARDCODED_${assignment[1].toUpperCase()}`);
    }
  }

  if (/\bVITE_[A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE|DATABASE|SMTP_PASS)\b/.test(line)) {
    report(scope, path, lineNumber, 'SERVER_SECRET_EXPOSED_TO_VITE');
  }
  if (
    path !== 'scripts/security-audit.mjs' &&
    /localStorage[^\n]*(?:accessToken|refreshToken)|(?:accessToken|refreshToken)[^\n]*localStorage/i.test(
      line,
    )
  ) {
    report(scope, path, lineNumber, 'AUTH_TOKEN_PERSISTED_IN_WEB_STORAGE');
  }
};

const paths = runGit(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
  .split('\0')
  .filter(Boolean);
for (const path of paths) {
  if (forbiddenPath.test(path) && !allowedEnvExample.test(path))
    report('WORKTREE', path, 0, 'FORBIDDEN_SENSITIVE_FILE');
  if (/(?:^|\/)(?:uploads?|private_uploads|\.private|dist|build|coverage)(?:\/|$)/i.test(path)) {
    report('WORKTREE', path, 0, 'RUNTIME_OR_BUILD_ARTIFACT_TRACKED');
  }
  let buffer;
  try {
    buffer = readFileSync(path);
  } catch {
    continue;
  }
  if (buffer.length > 3 * 1024 * 1024 || buffer.subarray(0, 4096).includes(0)) continue;
  const text = buffer.toString('utf8');
  text
    .split(/\r?\n/)
    .forEach((line, index) =>
      scanLine(line, 'WORKTREE', path, index + 1, { genericAssignments: isConfigFile(path) }),
    );
}

if (includeHistory) {
  const log = runGit([
    'log',
    '--all',
    '--format=@@COMMIT:%H',
    '-p',
    '--full-history',
    '--no-ext-diff',
    '--',
    '.',
    ':(exclude)*-lock.json',
  ]);
  let commit = '';
  let path = '';
  for (const rawLine of log.split(/\r?\n/)) {
    if (rawLine.startsWith('@@COMMIT:')) {
      commit = rawLine.slice(9, 21);
      path = '';
      continue;
    }
    if (rawLine.startsWith('+++ b/')) {
      path = rawLine.slice(6);
      continue;
    }
    if (!path || !rawLine.startsWith('+') || rawLine.startsWith('+++')) continue;
    scanLine(rawLine.slice(1), `HISTORY:${commit}`, path, 0, {
      genericAssignments: isConfigFile(path),
    });
  }
}

const unique = [
  ...new Map(
    findings.map((item) => [`${item.scope}|${item.path}|${item.line}|${item.rule}`, item]),
  ).values(),
];
if (unique.length) {
  console.error(
    `SECURITY AUDIT FAILED (${unique.length} redacted finding${unique.length === 1 ? '' : 's'})`,
  );
  for (const item of unique)
    console.error(`${item.scope}\t${item.path}${item.line ? `:${item.line}` : ''}\t${item.rule}`);
  process.exit(1);
}

console.log(
  `SECURITY AUDIT PASSED (${paths.length} source files${includeHistory ? ', Git history checked' : ''})`,
);
