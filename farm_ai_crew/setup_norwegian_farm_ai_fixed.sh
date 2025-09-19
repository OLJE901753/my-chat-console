#!/bin/bash
# Norwegian Farm AI Setup Script - FIXED VERSION
# Sets up Agent OS with Norwegian farming optimization standards

echo "🇳🇴 Setting up Norwegian Farm AI with Agent OS..."
echo "=================================================="

# Get current directory
CURRENT_DIR=$(pwd)
AGENT_OS_DIR="$CURRENT_DIR/.agent-os"

# Create Agent OS directories
echo "📁 Creating Agent OS directories..."
mkdir -p "$AGENT_OS_DIR/standards"
mkdir -p "$AGENT_OS_DIR/product"
mkdir -p "$AGENT_OS_DIR/agents"
mkdir -p "$AGENT_OS_DIR/tools"

# Create Norwegian standards
echo "📝 Creating Norwegian farming standards..."
cat > "$AGENT_OS_DIR/standards/python-style.md" << 'EOF'
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
EOF

# Create Universal Prompt
echo "🎯 Creating Universal Prompt..."
cat > "$AGENT_OS_DIR/product/mission.md" << 'EOF'
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
EOF

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found. Please install Python first."
    exit 1
fi

echo "Using Python command: $PYTHON_CMD"

# Install requirements
if [ -f "requirements_norwegian.txt" ]; then
    echo "Installing from requirements_norwegian.txt..."
    $PYTHON_CMD -m pip install -r requirements_norwegian.txt
else
    echo "Installing basic requirements..."
    $PYTHON_CMD -m pip install pandas scikit-learn crewai
fi

# Install CrewAI
echo "🤖 Installing CrewAI..."
$PYTHON_CMD -m pip install crewai crewai-tools

# Create sample farm data
echo "📊 Creating sample farm data..."
$PYTHON_CMD -c "
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
"

# Test the setup
echo "🧪 Testing Norwegian Farm AI setup..."
if [ -f "run_norwegian_farm_ai.py" ]; then
    $PYTHON_CMD run_norwegian_farm_ai.py --complete-optimization
else
    echo "⚠️  run_norwegian_farm_ai.py not found, skipping test"
fi

echo ""
echo "✅ Norwegian Farm AI setup complete!"
echo "=================================================="
echo "🎯 Ready to optimize Norwegian farming operations!"
echo "💰 Maximize subsidies and outsmart bureaucracy!"
echo ""
echo "Agent OS installed to: $AGENT_OS_DIR"
echo ""
echo "Usage examples:"
echo "  $PYTHON_CMD run_norwegian_farm_ai.py --complete-optimization"
echo "  $PYTHON_CMD run_norwegian_farm_ai.py --optimize-subsidies"
echo "  $PYTHON_CMD run_norwegian_farm_ai.py --export-tax-data"
echo "  $PYTHON_CMD run_norwegian_farm_ai.py --farm-data your_data.csv"
echo ""
echo "🇳🇴 For the honor, not the glory—by the people, for the people!"
