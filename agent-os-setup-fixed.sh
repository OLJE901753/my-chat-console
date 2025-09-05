#!/bin/bash

# Agent OS Base Installation Script - FIXED VERSION
# This script installs Agent OS to the current directory with better error handling

set -e  # Exit on error

# Initialize flags
OVERWRITE_INSTRUCTIONS=false
OVERWRITE_STANDARDS=false
OVERWRITE_CONFIG=false
CLAUDE_CODE=false
CURSOR=false

# Base URL for raw GitHub content
BASE_URL="https://raw.githubusercontent.com/buildermethods/agent-os/main"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --overwrite-instructions)
            OVERWRITE_INSTRUCTIONS=true
            shift
            ;;
        --overwrite-standards)
            OVERWRITE_STANDARDS=true
            shift
            ;;
        --overwrite-config)
            OVERWRITE_CONFIG=true
            shift
            ;;
        --claude-code|--claude|--claude_code)
            CLAUDE_CODE=true
            shift
            ;;
        --cursor|--cursor-cli)
            CURSOR=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --overwrite-instructions    Overwrite existing instruction files"
            echo "  --overwrite-standards       Overwrite existing standards files"
            echo "  --overwrite-config          Overwrite existing config.yml"
            echo "  --claude-code               Add Claude Code support"
            echo "  --cursor                    Add Cursor support"
            echo "  -h, --help                  Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo ""
echo "🚀 Agent OS Base Installation - FIXED VERSION"
echo "============================================="
echo ""

# Set installation directory to current directory
CURRENT_DIR=$(pwd)
INSTALL_DIR="$CURRENT_DIR/.agent-os"

echo "📍 The Agent OS base installation will be installed in the current directory ($CURRENT_DIR)"
echo ""

echo "📁 Creating base directories..."
echo ""
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/setup"
mkdir -p "$INSTALL_DIR/instructions"
mkdir -p "$INSTALL_DIR/standards"
mkdir -p "$INSTALL_DIR/commands"

# Define helper functions locally to avoid dependency on remote file
download_file() {
    local url="$1"
    local output="$2"
    local overwrite="$3"
    local description="$4"
    
    if [ -f "$output" ] && [ "$overwrite" = "false" ]; then
        echo "  ⏭️  Skipping $description (already exists)"
        return 0
    fi
    
    echo "  📥 Downloading $description..."
    if curl -sSL "$url" -o "$output"; then
        echo "  ✅ Downloaded $description"
    else
        echo "  ❌ Failed to download $description"
        return 1
    fi
}

install_from_github() {
    local install_dir="$1"
    local overwrite_instructions="$2"
    local overwrite_standards="$3"
    
    echo "  📂 Installing instructions..."
    download_file "${BASE_URL}/instructions/README.md" \
        "$install_dir/instructions/README.md" \
        "$overwrite_instructions" \
        "instructions/README.md"
    
    echo "  📂 Installing standards..."
    download_file "${BASE_URL}/standards/README.md" \
        "$install_dir/standards/README.md" \
        "$overwrite_standards" \
        "standards/README.md"
    
    echo "  📂 Installing commands..."
    download_file "${BASE_URL}/commands/README.md" \
        "$install_dir/commands/README.md" \
        "true" \
        "commands/README.md"
}

# Download functions.sh to its permanent location and source it
echo "📥 Downloading setup functions..."
if curl -sSL "${BASE_URL}/setup/functions.sh" -o "$INSTALL_DIR/setup/functions.sh"; then
    echo "  ✅ Functions downloaded successfully"
    # Source the functions if available, but don't fail if it doesn't work
    if [ -f "$INSTALL_DIR/setup/functions.sh" ]; then
        source "$INSTALL_DIR/setup/functions.sh" 2>/dev/null || echo "  ⚠️  Could not source functions.sh, using local functions"
    fi
else
    echo "  ⚠️  Could not download functions.sh, using local functions"
fi

echo ""
echo "📦 Installing the latest version of Agent OS from the Agent OS GitHub repository..."

# Install /instructions, /standards, and /commands folders and files from GitHub
install_from_github "$INSTALL_DIR" "$OVERWRITE_INSTRUCTIONS" "$OVERWRITE_STANDARDS"

# Download config.yml
echo ""
echo "📥 Downloading configuration..."
download_file "${BASE_URL}/config.yml" \
    "$INSTALL_DIR/config.yml" \
    "$OVERWRITE_CONFIG" \
    "config.yml"

# Download setup/project.sh
echo ""
echo "📥 Downloading project setup script..."
download_file "${BASE_URL}/setup/project.sh" \
    "$INSTALL_DIR/setup/project.sh" \
    "true" \
    "setup/project.sh"
chmod +x "$INSTALL_DIR/setup/project.sh"

# Handle Claude Code installation
if [ "$CLAUDE_CODE" = true ]; then
    echo ""
    echo "📥 Downloading Claude Code agent templates..."
    mkdir -p "$INSTALL_DIR/claude-code/agents"

    # Download agents to base installation for project use
    echo "  📂 Agent templates:"
    for agent in context-fetcher date-checker file-creator git-workflow project-manager test-runner; do
        download_file "${BASE_URL}/claude-code/agents/${agent}.md" \
            "$INSTALL_DIR/claude-code/agents/${agent}.md" \
            "false" \
            "claude-code/agents/${agent}.md"
    done

    # Update config to enable claude_code
    if [ -f "$INSTALL_DIR/config.yml" ]; then
        if command -v sed >/dev/null 2>&1; then
            sed -i.bak '/claude_code:/,/enabled:/ s/enabled: false/enabled: true/' "$INSTALL_DIR/config.yml" && rm "$INSTALL_DIR/config.yml.bak"
        else
            echo "  ⚠️  sed not available, please manually enable claude_code in config.yml"
        fi
    fi
fi

# Handle Cursor installation
if [ "$CURSOR" = true ]; then
    echo ""
    echo "📥 Enabling Cursor support..."

    # Only update config to enable cursor
    if [ -f "$INSTALL_DIR/config.yml" ]; then
        if command -v sed >/dev/null 2>&1; then
            sed -i.bak '/cursor:/,/enabled:/ s/enabled: false/enabled: true/' "$INSTALL_DIR/config.yml" && rm "$INSTALL_DIR/config.yml.bak"
            echo "  ✓ Cursor enabled in configuration"
        else
            echo "  ⚠️  sed not available, please manually enable cursor in config.yml"
        fi
    fi
fi

# Create a basic config.yml if it doesn't exist
if [ ! -f "$INSTALL_DIR/config.yml" ]; then
    echo ""
    echo "📝 Creating basic configuration..."
    cat > "$INSTALL_DIR/config.yml" << 'EOF'
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
EOF
    echo "  ✅ Basic configuration created"
fi

# Success message
echo ""
echo "✅ Agent OS base installation has been completed."
echo ""

# Dynamic project installation command
PROJECT_SCRIPT="$INSTALL_DIR/setup/project.sh"
echo "--------------------------------"
echo ""
echo "To install Agent OS in a project, run:"
echo ""
echo "   cd <project-directory>"
echo "   $PROJECT_SCRIPT"
echo ""
echo "--------------------------------"
echo ""
echo "📍 Base installation files installed to:"
echo "   $INSTALL_DIR/instructions/      - Agent OS instructions"
echo "   $INSTALL_DIR/standards/         - Development standards"
echo "   $INSTALL_DIR/commands/          - Command templates"
echo "   $INSTALL_DIR/config.yml         - Configuration"
echo "   $INSTALL_DIR/setup/project.sh   - Project installation script"

if [ "$CLAUDE_CODE" = true ]; then
    echo "   $INSTALL_DIR/claude-code/agents/ - Claude Code agent templates"
fi

echo ""
echo "--------------------------------"
echo ""
echo "Next steps:"
echo ""
echo "1. Customize your standards in $INSTALL_DIR/standards/"
echo ""
echo "2. Configure project types in $INSTALL_DIR/config.yml"
echo ""
echo "3. Navigate to a project directory and run: $PROJECT_SCRIPT"
echo ""
echo "--------------------------------"
echo ""
echo "Refer to the official Agent OS docs at:"
echo "https://buildermethods.com/agent-os"
echo ""
echo "Keep building! 🚀"
echo ""
echo
