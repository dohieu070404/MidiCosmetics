param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$target = Join-Path $projectRoot '.env.docker.local'

if ((Test-Path $target) -and -not $Force) {
  throw '.env.docker.local already exists. Use -Force only if you intentionally want to rotate local credentials.'
}

function New-RandomHex([int]$ByteCount) {
  $bytes = New-Object byte[] $ByteCount
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return ([System.BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}

$databasePassword = New-RandomHex 32
$accessSecret = New-RandomHex 48
$refreshSecret = New-RandomHex 48
$lines = @(
  '# Generated local-only credentials. Never commit this file.',
  "POSTGRES_PASSWORD=$databasePassword",
  "DATABASE_URL=postgresql://midi:$databasePassword@database:5432/midi_cosmetics?schema=public",
  "DIRECT_URL=postgresql://midi:$databasePassword@database:5432/midi_cosmetics?schema=public",
  "JWT_ACCESS_SECRET=$accessSecret",
  "JWT_REFRESH_SECRET=$refreshSecret"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($target, (($lines -join [Environment]::NewLine) + [Environment]::NewLine), $utf8NoBom)
Write-Host 'Created .env.docker.local with random local-only credentials.'
Write-Host 'No sample admin account will be created or changed.'
