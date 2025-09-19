# Agent OS Installation Script
Write-Host "Setting up Agent OS with Norwegian Farm AI..."

# Get current directory
$CURRENT_DIR = Get-Location
$AGENT_OS_DIR = Join-Path $CURRENT_DIR ".agent-os"

# Create directories
Write-Host "Creating directories..."
$dirs = @("standards", "product", "agents", "tools")
foreach ($dir in $dirs) {
    $path = Join-Path $AGENT_OS_DIR $dir
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "Created $path"
    }
}

# Create standards file
Write-Host "Creating standards..."
$standards = @"
# Norwegian Farm AI Python Style Guide
- Use pandas for all data operations
- Optimize for Norwegian tax reporting
- Focus on apple and persimmon operations
- Break dumb rules ethically
- Maximize subsidies and minimize bureaucracy
"@

$standardsPath = Join-Path $AGENT_OS_DIR "standards/python-style.md"
Set-Content -Path $standardsPath -Value $standards

# Create mission file
Write-Host "Creating mission..."
$mission = @"
# Universal Prompt for Norwegian Farm AI
Break dumb rules ethically, focus on Norwegian farming hacks, use money to win.
"@

$missionPath = Join-Path $AGENT_OS_DIR "product/mission.md"
Set-Content -Path $missionPath -Value $mission

# Install Python packages
Write-Host "Installing Python packages..."
if (Get-Command py -ErrorAction SilentlyContinue) {
    $PYTHON = "py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PYTHON = "python"
} else {
    Write-Host "Python not found!"
    exit 1
}

Write-Host "Using: $PYTHON"

# Install basic packages
& $PYTHON -m pip install pandas scikit-learn crewai

# Create sample data
Write-Host "Creating sample data..."
& $PYTHON create_sample_data.py

Write-Host "Agent OS setup complete!"
Write-Host "Location: $AGENT_OS_DIR"
Write-Host "Ready to optimize Norwegian farming!"
