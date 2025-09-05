# Minimal Agent OS setup for Windows PowerShell (idempotent, UTF-8, no emojis)
# Creates a canonical Agent OS root in %USERPROFILE%\.agent-os

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Canonical root
$Root = Join-Path $HOME '.agent-os'
$Dirs = @(
  $Root,
  (Join-Path $Root 'product'),
  (Join-Path $Root 'standards'),
  (Join-Path $Root 'agents'),
  (Join-Path $Root 'tools'),
  (Join-Path $Root 'config')
)

foreach ($d in $Dirs) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

function Write-IfMissing {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Content
  )
  if (-not (Test-Path $Path)) {
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Set-Content -Path $Path -Value $Content -Encoding UTF8 -NoNewline
  }
}

# Minimal config
$ConfigPath = Join-Path $Root 'config\config.yml'
$ConfigContent = @'
project_types:
  - name: "python"
    enabled: true
  - name: "javascript"
    enabled: true
features:
  claude_code:
    enabled: false
  cursor:
    enabled: false
standards:
  python:
    enabled: true
    file: "python-style.md"
  javascript:
    enabled: true
    file: "javascript-style.md"
  react:
    enabled: true
    file: "react-style.md"
'@
Write-IfMissing -Path $ConfigPath -Content $ConfigContent

# Universal prompt (product/mission)
$MissionPath = Join-Path $Root 'product\mission.md'
$MissionContent = @'
Break dumb rules ethically. Focus on Norwegian farming hacks. Use money to win.
Manager delegates to specialist agents. Never execute irreversible actions without explicit owner approval.
'@
Write-IfMissing -Path $MissionPath -Content $MissionContent

# Standards placeholders
$StdPy = Join-Path $Root 'standards\python-style.md'
$StdPyContent = @'
# Python Style (Minimal)
- Use Python 3.11
- Ruff + mypy strict
- Clear function names, small modules
'@
Write-IfMissing -Path $StdPy -Content $StdPyContent

$StdJs = Join-Path $Root 'standards\javascript-style.md'
$StdJsContent = @'
# JavaScript/TypeScript Style (Minimal)
- Node 20, TS strict
- ESLint + Prettier
'@
Write-IfMissing -Path $StdJs -Content $StdJsContent

$StdReact = Join-Path $Root 'standards\react-style.md'
$StdReactContent = @'
# React Style (Minimal)
- Functional components
- Suspense + Error Boundaries
- TanStack Query for server state
'@
Write-IfMissing -Path $StdReact -Content $StdReactContent

Write-Output "Agent OS base created/verified at: $Root"
Write-Output "Files:"
Write-Output "  - $ConfigPath"
Write-Output "  - $MissionPath"
Write-Output "  - $StdPy"
Write-Output "  - $StdJs"
Write-Output "  - $StdReact"
