# Agent OS Base Installation Script - Final Working Version
# This script installs Agent OS to the current directory with Windows compatibility

param(
    [switch]$OverwriteInstructions,
    [switch]$OverwriteStandards,
    [switch]$OverwriteConfig,
    [switch]$ClaudeCode,
    [switch]$Cursor,
    [switch]$Help
)

# Base URL for raw GitHub content
$BASE_URL = "https://raw.githubusercontent.com/buildermethods/agent-os/main"

# Show help if requested
if ($Help) {
    Write-Host ""
    Write-Host "Usage: .\agent-os-setup-final.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -OverwriteInstructions    Overwrite existing instruction files"
    Write-Host "  -OverwriteStandards       Overwrite existing standards files"
    Write-Host "  -OverwriteConfig          Overwrite existing config.yml"
    Write-Host "  -ClaudeCode               Add Claude Code support"
    Write-Host "  -Cursor                   Add Cursor support"
    Write-Host "  -Help                     Show this help message"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Agent OS Base Installation - Final Working Version"
Write-Host "====================================================="
Write-Host ""

# Set installation directory to current directory
$CURRENT_DIR = Get-Location
$INSTALL_DIR = Join-Path $CURRENT_DIR ".agent-os"

Write-Host "Agent OS will be installed in the current directory ($CURRENT_DIR)"
Write-Host ""

Write-Host "Creating base directories..."
Write-Host ""

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
        Write-Host "  Created $dir"
    }
}

# Helper function to download files
function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath,
        [bool]$Overwrite,
        [string]$Description
    )
    
    if ((Test-Path $OutputPath) -and !$Overwrite) {
        Write-Host "  Skipping $Description (already exists)"
        return $true
    }
    
    Write-Host "  Downloading $Description..."
    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
        Write-Host "  Downloaded $Description"
        return $true
    }
    catch {
        Write-Host "  Failed to download $Description - Error: $($_.Exception.Message)"
        return $false
    }
}

# Download functions.sh
Write-Host "Downloading setup functions..."
$functionsUrl = "$BASE_URL/setup/functions.sh"
$functionsPath = Join-Path $INSTALL_DIR "setup/functions.sh"
Download-File -Url $functionsUrl -OutputPath $functionsPath -Overwrite $true -Description "setup/functions.sh"

Write-Host ""
Write-Host "Installing the latest version of Agent OS from the Agent OS GitHub repository..."

# Install instructions
Write-Host "  Installing instructions..."
$instructionsUrl = "$BASE_URL/instructions/README.md"
$instructionsPath = Join-Path $INSTALL_DIR "instructions/README.md"
Download-File -Url $instructionsUrl -OutputPath $instructionsPath -Overwrite $OverwriteInstructions -Description "instructions/README.md"

# Install standards
Write-Host "  Installing standards..."
$standardsUrl = "$BASE_URL/standards/README.md"
$standardsPath = Join-Path $INSTALL_DIR "standards/README.md"
Download-File -Url $standardsUrl -OutputPath $standardsPath -Overwrite $OverwriteStandards -Description "standards/README.md"

# Install commands
Write-Host "  Installing commands..."
$commandsUrl = "$BASE_URL/commands/README.md"
$commandsPath = Join-Path $INSTALL_DIR "commands/README.md"
Download-File -Url $commandsUrl -OutputPath $commandsPath -Overwrite $true -Description "commands/README.md"

# Download config.yml
Write-Host ""
Write-Host "Downloading configuration..."
$configUrl = "$BASE_URL/config.yml"
$configPath = Join-Path $INSTALL_DIR "config.yml"
Download-File -Url $configUrl -OutputPath $configPath -Overwrite $OverwriteConfig -Description "config.yml"

# Download setup/project.sh
Write-Host ""
Write-Host "Downloading project setup script..."
$projectUrl = "$BASE_URL/setup/project.sh"
$projectPath = Join-Path $INSTALL_DIR "setup/project.sh"
Download-File -Url $projectUrl -OutputPath $projectPath -Overwrite $true -Description "setup/project.sh"

# Handle Claude Code installation
if ($ClaudeCode) {
    Write-Host ""
    Write-Host "Downloading Claude Code agent templates..."
    $claudeDir = Join-Path $INSTALL_DIR "claude-code/agents"
    if (!(Test-Path $claudeDir)) {
        New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    }

    # Download agents
    Write-Host "  Agent templates:"
    $agents = @("context-fetcher", "date-checker", "file-creator", "git-workflow", "project-manager", "test-runner")
    foreach ($agent in $agents) {
        $agentUrl = "$BASE_URL/claude-code/agents/$agent.md"
        $agentPath = Join-Path $claudeDir "$agent.md"
        Download-File -Url $agentUrl -OutputPath $agentPath -Overwrite $false -Description "claude-code/agents/$agent.md"
    }

    # Update config to enable claude_code
    if (Test-Path $configPath) {
        try {
            $configContent = Get-Content $configPath -Raw
            $configContent = $configContent -replace 'claude_code:\s*\n\s*enabled:\s*false', "claude_code:`nenabled: true"
            Set-Content -Path $configPath -Value $configContent
            Write-Host "  Enabled claude_code in configuration"
        }
        catch {
            Write-Host "  Could not update config.yml, please manually enable claude_code"
        }
    }
}

# Handle Cursor installation
if ($Cursor) {
    Write-Host ""
    Write-Host "Enabling Cursor support..."

    if (Test-Path $configPath) {
        try {
            $configContent = Get-Content $configPath -Raw
            $configContent = $configContent -replace 'cursor:\s*\n\s*enabled:\s*false', "cursor:`nenabled: true"
            Set-Content -Path $configPath -Value $configContent
            Write-Host "  Enabled cursor in configuration"
        }
        catch {
            Write-Host "  Could not update config.yml, please manually enable cursor"
        }
    }
}

# Create a basic config.yml if it doesn't exist
if (!(Test-Path $configPath)) {
    Write-Host ""
    Write-Host "📝 Creating basic configuration..."
    
    # Create config content using Out-File to avoid YAML parsing issues
    $configContent = @"
# Agent OS Configuration
version: "1.0.0"

# Project types
project_types:
  - name: "python"
    description: "Python projects"
    enabled: true
  - name: "javascript"
    description: "JavaScript/Node.js projects"
    enabled: true
  - name: "react"
    description: "React applications"
    enabled: true

# Features
features:
  claude_code:
    enabled: false
  cursor:
    enabled: false

# Standards
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
"@
    
    $configContent | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "  ✅ Basic configuration created"
}

# Success message
Write-Host ""
Write-Host "✅ Agent OS base installation has been completed."
Write-Host ""

# Dynamic project installation command
$PROJECT_SCRIPT = Join-Path $INSTALL_DIR "setup/project.sh"
Write-Host "--------------------------------"
Write-Host ""
Write-Host "To install Agent OS in a project, run:"
Write-Host ""
Write-Host "   cd project-directory"
Write-Host "   $PROJECT_SCRIPT"
Write-Host ""
Write-Host "--------------------------------"
Write-Host ""
Write-Host "📍 Base installation files installed to:"
Write-Host "   $INSTALL_DIR\instructions\      - Agent OS instructions"
Write-Host "   $INSTALL_DIR\standards\         - Development standards"
Write-Host "   $INSTALL_DIR\commands\          - Command templates"
Write-Host "   $INSTALL_DIR\config.yml         - Configuration"
Write-Host "   $INSTALL_DIR\setup\project.sh   - Project installation script"

if ($ClaudeCode) {
    Write-Host "   $INSTALL_DIR\claude-code\agents\ - Claude Code agent templates"
}

Write-Host ""
Write-Host "--------------------------------"
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "1. Customize your standards in $INSTALL_DIR\standards\"
Write-Host ""
Write-Host "2. Configure project types in $INSTALL_DIR\config.yml"
Write-Host ""
Write-Host "3. Navigate to a project directory and run: $PROJECT_SCRIPT"
Write-Host ""
Write-Host "--------------------------------"
Write-Host ""
Write-Host "Refer to the official Agent OS docs at:"
Write-Host "https://buildermethods.com/agent-os"
Write-Host ""
Write-Host "Keep building! 🚀"
Write-Host ""
