# Agent OS Base Installation Script - Minimal Working Version
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\agent-os-minimal.ps1 [OPTIONS]"
    Write-Host "Options:"
    Write-Host "  -Help    Show this help message"
    exit 0
}

Write-Host "🚀 Agent OS Base Installation - Minimal Version"
Write-Host "=============================================="

$CURRENT_DIR = Get-Location
$INSTALL_DIR = Join-Path $CURRENT_DIR ".agent-os"

Write-Host "📍 Installing to: $INSTALL_DIR"

# Create directories
$directories = @(
    $INSTALL_DIR,
    (Join-Path $INSTALL_DIR "setup"),
    (Join-Path $INSTALL_DIR "instructions"),
    (Join-Path $INSTALL_DIR "standards"),
    (Join-Path $INSTALL_DIR "commands")
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created $dir"
    }
}

# Download files
$BASE_URL = "https://raw.githubusercontent.com/buildermethods/agent-os/main"

Write-Host "📥 Downloading files..."

try {
    # Download functions.sh
    $functionsUrl = "$BASE_URL/setup/functions.sh"
    $functionsPath = Join-Path $INSTALL_DIR "setup/functions.sh"
    Invoke-WebRequest -Uri $functionsUrl -OutFile $functionsPath -UseBasicParsing
    Write-Host "✅ Downloaded functions.sh"

    # Download instructions
    $instructionsUrl = "$BASE_URL/instructions/README.md"
    $instructionsPath = Join-Path $INSTALL_DIR "instructions/README.md"
    Invoke-WebRequest -Uri $instructionsUrl -OutFile $instructionsPath -UseBasicParsing
    Write-Host "✅ Downloaded instructions"

    # Download standards
    $standardsUrl = "$BASE_URL/standards/README.md"
    $standardsPath = Join-Path $INSTALL_DIR "standards/README.md"
    Invoke-WebRequest -Uri $standardsUrl -OutFile $standardsPath -UseBasicParsing
    Write-Host "✅ Downloaded standards"

    # Download commands
    $commandsUrl = "$BASE_URL/commands/README.md"
    $commandsPath = Join-Path $INSTALL_DIR "commands/README.md"
    Invoke-WebRequest -Uri $commandsUrl -OutFile $commandsPath -UseBasicParsing
    Write-Host "✅ Downloaded commands"

    # Download config.yml
    $configUrl = "$BASE_URL/config.yml"
    $configPath = Join-Path $INSTALL_DIR "config.yml"
    Invoke-WebRequest -Uri $configUrl -OutFile $configPath -UseBasicParsing
    Write-Host "✅ Downloaded config.yml"

    # Download project.sh
    $projectUrl = "$BASE_URL/setup/project.sh"
    $projectPath = Join-Path $INSTALL_DIR "setup/project.sh"
    Invoke-WebRequest -Uri $projectUrl -OutFile $projectPath -UseBasicParsing
    Write-Host "✅ Downloaded project.sh"

    Write-Host ""
    Write-Host "✅ Agent OS installation completed successfully!"
    Write-Host ""
    Write-Host "📍 Files installed to:"
    Write-Host "   $INSTALL_DIR\instructions\"
    Write-Host "   $INSTALL_DIR\standards\"
    Write-Host "   $INSTALL_DIR\commands\"
    Write-Host "   $INSTALL_DIR\config.yml"
    Write-Host "   $INSTALL_DIR\setup\project.sh"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Customize your standards in $INSTALL_DIR\standards\"
    Write-Host "2. Configure project types in $INSTALL_DIR\config.yml"
    Write-Host "3. Navigate to a project directory and run: $INSTALL_DIR\setup\project.sh"
    Write-Host ""
    Write-Host "Keep building! 🚀"

}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Please check your internet connection and try again."
}
