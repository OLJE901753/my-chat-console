#!/bin/bash
# Norwegian Farm AI Setup Script
# Sets up Agent OS with Norwegian farming optimization standards

echo "🇳🇴 Setting up Norwegian Farm AI with Agent OS..."
echo "=================================================="

# Create Agent OS directories
echo "📁 Creating Agent OS directories..."
mkdir -p ~/.agent-os/standards
mkdir -p ~/.agent-os/product
mkdir -p ~/.agent-os/agents
mkdir -p ~/.agent-os/tools

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install -r requirements_norwegian.txt

# Install CrewAI
echo "🤖 Installing CrewAI..."
pip install crewai crewai-tools

# Create sample farm data
echo "📊 Creating sample farm data..."
python3 -c "
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

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
python3 run_norwegian_farm_ai.py --complete-optimization

echo ""
echo "✅ Norwegian Farm AI setup complete!"
echo "=================================================="
echo "🎯 Ready to optimize Norwegian farming operations!"
echo "💰 Maximize subsidies and outsmart bureaucracy!"
echo ""
echo "Usage examples:"
echo "  python3 run_norwegian_farm_ai.py --complete-optimization"
echo "  python3 run_norwegian_farm_ai.py --optimize-subsidies"
echo "  python3 run_norwegian_farm_ai.py --export-tax-data"
echo "  python3 run_norwegian_farm_ai.py --farm-data your_data.csv"
echo ""
echo "🇳🇴 For the honor, not the glory—by the people, for the people!"
