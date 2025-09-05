# Norwegian Farm AI Setup Script - PowerShell Version
# Sets up Agent OS with Norwegian farming optimization standards

Write-Host "🇳🇴 Setting up Norwegian Farm AI with Agent OS..."
Write-Host "=================================================="

# Get current directory
$CURRENT_DIR = Get-Location
$AGENT_OS_DIR = Join-Path $CURRENT_DIR ".agent-os"

# Create Agent OS directories
Write-Host "📁 Creating Agent OS directories..."
$directories = @(
    (Join-Path $AGENT_OS_DIR "standards"),
    (Join-Path $AGENT_OS_DIR "product"),
    (Join-Path $AGENT_OS_DIR "agents"),
    (Join-Path $AGENT_OS_DIR "tools")
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created $dir"
    }
}

# Create Norwegian standards
Write-Host "📝 Creating Norwegian farming standards..."
$standardsContent = @"
# Norwegian Farm AI Python Style Guide

## Core Principles
- Use pandas for all data operations
- Optimize for Norwegian tax reporting requirements
- Focus on apple and persimmon operations
- Break dumb rules ethically
- Maximize subsidies and minimize bureaucracy
- Use money to win against corrupt systems

## Code Standards
- Strict typing with type hints
- DRY/KISS principles
- Functional programming over OOP
- Minimal lines for maintainability
- Error handling with specific, actionable errors
- No silent failures

## Norwegian Farming Hacks
- Exploit tax exemptions legally
- Optimize for subsidy eligibility
- Use blockchain for data verification
- Focus on export-ready operations
- Carbon neutral practices for grants
"@

$standardsPath = Join-Path $AGENT_OS_DIR "standards/python-style.md"
Set-Content -Path $standardsPath -Value $standardsContent

# Create Universal Prompt
Write-Host "🎯 Creating Universal Prompt..."
$missionContent = @"
# Universal Prompt for Norwegian Farm AI

Break dumb rules ethically, focus on Norwegian farming hacks, use money to win.

## Mission
- Outsmart Norwegian bureaucracy through legal workarounds
- Maximize farm subsidies and tax benefits
- Optimize for apple and persimmon operations
- Use technology to disrupt corrupt political systems
- Ensure no harm to good people

## Approach
- Leverage open-source tools to rival expensive platforms
- Use cheap APIs (<$500/year) to compete with million-NOK systems
- Apply Norwegian business and farming strategies
- Focus on practical hacks over theoretical solutions
"@

$missionPath = Join-Path $AGENT_OS_DIR "product/mission.md"
Set-Content -Path $missionPath -Value $missionContent

# Install Python dependencies
Write-Host "🐍 Installing Python dependencies..."
if (Get-Command python -ErrorAction SilentlyContinue) {
    $PYTHON_CMD = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $PYTHON_CMD = "py"
} else {
    Write-Host "❌ Python not found. Please install Python first."
    exit 1
}

Write-Host "Using Python command: $PYTHON_CMD"

# Install requirements
if (Test-Path "requirements_norwegian.txt") {
    Write-Host "Installing from requirements_norwegian.txt..."
    & $PYTHON_CMD -m pip install -r requirements_norwegian.txt
} else {
    Write-Host "Installing basic requirements..."
    & $PYTHON_CMD -m pip install pandas scikit-learn crewai
}

# Install CrewAI
Write-Host "🤖 Installing CrewAI..."
& $PYTHON_CMD -m pip install crewai crewai-tools

# Create sample farm data
Write-Host "📊 Creating sample farm data..."
$pythonScript = @"
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# Create sample Norwegian farm data
np.random.seed(42)
data = {
    'date': pd.date_range('2024-01-01', periods=365, freq='D'),
    'temperature': np.random.normal(15, 5, 365),
    'precipitation': np.random.exponential(2, 365),
    'soil_moisture': np.random.uniform(0.3, 0.8, 365),
    'apple_yield': np.random.normal(1000, 200, 365),
    'persimmon_yield': np.random.normal(800, 150, 365),
    'organic_certified': [True] * 365,
    'farm_size_hectares': [3.5] * 365,
    'export_ready': [True] * 365,
    'sustainable_practices': [True] * 365,
    'carbon_neutral': [True] * 365
}

df = pd.DataFrame(data)
df.to_csv('sample_farm_data.csv', index=False)
print('✅ Sample farm data created: sample_farm_data.csv')
"@

$pythonScript | & $PYTHON_CMD

# Test the setup
Write-Host "🧪 Testing Norwegian Farm AI setup..."
if (Test-Path "run_norwegian_farm_ai.py") {
    & $PYTHON_CMD run_norwegian_farm_ai.py --complete-optimization
} else {
    Write-Host "⚠️  run_norwegian_farm_ai.py not found, skipping test"
}

Write-Host ""
Write-Host "✅ Norwegian Farm AI setup complete!"
Write-Host "=================================================="
Write-Host "🎯 Ready to optimize Norwegian farming operations!"
Write-Host "💰 Maximize subsidies and outsmart bureaucracy!"
Write-Host ""
Write-Host "Agent OS installed to: $AGENT_OS_DIR"
Write-Host ""
Write-Host "Usage examples:"
Write-Host "  $PYTHON_CMD run_norwegian_farm_ai.py --complete-optimization"
Write-Host "  $PYTHON_CMD run_norwegian_farm_ai.py --optimize-subsidies"
Write-Host "  $PYTHON_CMD run_norwegian_farm_ai.py --export-tax-data"
Write-Host "  $PYTHON_CMD run_norwegian_farm_ai.py --farm-data your_data.csv"
Write-Host ""
Write-Host "🇳🇴 For the honor, not the glory—by the people, for the people!"
