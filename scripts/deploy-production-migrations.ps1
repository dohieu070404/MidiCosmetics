param(
  [string]$EnvFile = (Join-Path $PSScriptRoot '..\backend\.env.production.local')
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = Join-Path $projectRoot 'backend'
$resolvedEnvFile = [System.IO.Path]::GetFullPath($EnvFile)

if (-not (Test-Path -LiteralPath $resolvedEnvFile -PathType Leaf)) {
  throw "Không tìm thấy $resolvedEnvFile. Tạo file này với DATABASE_URL và DIRECT_URL của Supabase; file đã được Git ignore."
}

foreach ($rawLine in Get-Content -LiteralPath $resolvedEnvFile -Encoding UTF8) {
  $line = $rawLine.Trim()
  if (-not $line -or $line.StartsWith('#')) { continue }
  $separator = $line.IndexOf('=')
  if ($separator -lt 1) { continue }

  $name = $line.Substring(0, $separator).Trim()
  $value = $line.Substring($separator + 1).Trim()
  if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  if ($name -match '^[A-Z][A-Z0-9_]*$') {
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

foreach ($name in @('DATABASE_URL', 'DIRECT_URL')) {
  $value = [Environment]::GetEnvironmentVariable($name, 'Process')
  if (-not $value -or $value -notmatch '^postgres(?:ql)?://') {
    throw "$name phải là URL PostgreSQL hợp lệ trong $resolvedEnvFile."
  }
}

Push-Location $backendRoot
try {
  npm ci --ignore-scripts --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'npm ci thất bại.' }

  npm run prisma:generate
  if ($LASTEXITCODE -ne 0) { throw 'prisma generate thất bại.' }

  npm run prisma:deploy
  if ($LASTEXITCODE -ne 0) { throw 'prisma migrate deploy thất bại; database chưa bị reset. Hãy đọc lỗi phía trên trước khi thử lại.' }

  npm run prisma:status
  if ($LASTEXITCODE -ne 0) { throw 'Migration đã chạy nhưng bước kiểm tra trạng thái chưa thành công.' }

  Write-Host 'Prisma migrations production đã được áp dụng và kiểm tra thành công.'
} finally {
  Pop-Location
}
