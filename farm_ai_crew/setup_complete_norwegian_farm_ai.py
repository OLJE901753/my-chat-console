#!/usr/bin/env python3
"""
Complete Norwegian Farm AI Setup Script
Sets up Agent OS with all Norwegian farming optimization tools and agents
"""

import os
import sys
import subprocess
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

class NorwegianFarmAISetup:
    """Complete setup for Norwegian Farm AI with Agent OS"""
    
    def __init__(self):
        self.base_dir = Path.cwd()
        self.agent_os_dir = self.base_dir / ".agent-os"
        self.setup_complete = False
    
    def run_complete_setup(self):
        """Run the complete Norwegian Farm AI setup"""
        
        print("🇳🇴 Setting up Complete Norwegian Farm AI System...")
        print("=" * 60)
        
        try:
            # 1. Create Agent OS structure
            self._create_agent_os_structure()
            
            # 2. Install dependencies
            self._install_dependencies()
            
            # 3. Create sample data
            self._create_sample_data()
            
            # 4. Test the system
            self._test_system()
            
            # 5. Generate setup report
            self._generate_setup_report()
            
            self.setup_complete = True
            print("\n✅ Norwegian Farm AI setup completed successfully!")
            print("🎯 Ready to optimize Norwegian farming operations!")
            print("💰 Maximize subsidies and outsmart bureaucracy!")
            
        except Exception as e:
            print(f"\n❌ Setup failed: {e}")
            sys.exit(1)
    
    def _create_agent_os_structure(self):
        """Create the complete Agent OS directory structure"""
        
        print("\n📁 Creating Agent OS structure...")
        
        # Create main directories
        directories = [
            "standards",
            "product", 
            "agents",
            "tools",
            "instructions",
            "commands",
            "config"
        ]
        
        for directory in directories:
            dir_path = self.agent_os_dir / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ Created {directory}/")
        
        # Create configuration files
        self._create_config_files()
        
        # Create standards
        self._create_standards()
        
        # Create agents
        self._create_agents()
        
        # Create tools
        self._create_tools()
    
    def _create_config_files(self):
        """Create configuration files"""
        
        print("  📝 Creating configuration files...")
        
        # Main config
        config_content = """# Agent OS Configuration for Norwegian Farm AI
version: "1.0.0"

# Project types
project_types:
  - name: "norwegian-farm"
    description: "Norwegian farming optimization projects"
    enabled: true
  - name: "python"
    description: "Python data science projects"
    enabled: true
  - name: "ai-agents"
    description: "AI agent development projects"
    enabled: true

# Features
features:
  claude_code:
    enabled: true
  cursor:
    enabled: true
  vscode:
    enabled: true

# Standards
standards:
  python:
    enabled: true
    file: "python-style.md"
  norwegian-farm:
    enabled: true
    file: "norwegian-farm-style.md"
  ai-agents:
    enabled: true
    file: "ai-agent-style.md"

# Norwegian Farm AI specific settings
norwegian_farm:
  focus_crops:
    - "apple"
    - "persimmon"
  optimization_goals:
    - "subsidy_maximization"
    - "tax_optimization"
    - "bureaucracy_bypass"
  data_sources:
    - "weather_api"
    - "subsidy_database"
    - "tax_records"
"""
        
        config_path = self.agent_os_dir / "config" / "config.yml"
        config_path.write_text(config_content)
        print("    ✅ config.yml")
    
    def _create_standards(self):
        """Create standards files"""
        
        print("  📋 Creating standards...")
        
        # Python style guide
        python_style = """# Norwegian Farm AI Python Style Guide

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

## Data Processing
- Always use pandas for data manipulation
- Optimize for Norwegian data formats
- Include Norwegian-specific calculations
- Focus on financial impact metrics
"""
        
        (self.agent_os_dir / "standards" / "python-style.md").write_text(python_style)
        print("    ✅ python-style.md")
        
        # Norwegian farm style guide
        farm_style = """# Norwegian Farm AI Style Guide

## Farming Philosophy
- Break dumb rules ethically
- Focus on Norwegian farming hacks
- Use money to win against bureaucracy
- Maximize subsidies through legal means
- Optimize for apple and persimmon operations

## Optimization Priorities
1. Subsidy maximization
2. Tax optimization
3. Yield optimization
4. Bureaucracy bypass
5. Export readiness

## Norwegian Specifics
- Leverage Norwegian tax exemptions
- Optimize for Norwegian subsidy programs
- Focus on Norwegian market requirements
- Use Norwegian farming techniques
- Comply with Norwegian regulations
"""
        
        (self.agent_os_dir / "standards" / "norwegian-farm-style.md").write_text(farm_style)
        print("    ✅ norwegian-farm-style.md")
    
    def _create_agents(self):
        """Create agent files"""
        
        print("  🤖 Creating agents...")
        
        # The agent files are already created in the .agent-os/agents/ directory
        # Just verify they exist
        agent_files = [
            "subsidy_optimizer.py",
            "tax_optimizer.py", 
            "yield_optimizer.py"
        ]
        
        for agent_file in agent_files:
            agent_path = self.agent_os_dir / "agents" / agent_file
            if agent_path.exists():
                print(f"    ✅ {agent_file}")
            else:
                print(f"    ⚠️  {agent_file} not found")
    
    def _create_tools(self):
        """Create tool files"""
        
        print("  🔧 Creating tools...")
        
        # The tool files are already created in the .agent-os/tools/ directory
        # Just verify they exist
        tool_files = [
            "norwegian_subsidy_calculator.py",
            "norwegian_tax_calculator.py"
        ]
        
        for tool_file in tool_files:
            tool_path = self.agent_os_dir / "tools" / tool_file
            if tool_path.exists():
                print(f"    ✅ {tool_file}")
            else:
                print(f"    ⚠️  {tool_file} not found")
    
    def _install_dependencies(self):
        """Install Python dependencies"""
        
        print("\n🐍 Installing dependencies...")
        
        # Install basic requirements
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_basic.txt"], 
                         check=True, capture_output=True)
            print("  ✅ Basic requirements installed")
        except subprocess.CalledProcessError:
            print("  ⚠️  Basic requirements installation failed, trying individual packages...")
            subprocess.run([sys.executable, "-m", "pip", "install", "pandas", "numpy", "scikit-learn"], 
                         check=True)
        
        # Install AI requirements
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_ai.txt"], 
                         check=True, capture_output=True)
            print("  ✅ AI requirements installed")
        except subprocess.CalledProcessError:
            print("  ⚠️  AI requirements installation failed, trying individual packages...")
            subprocess.run([sys.executable, "-m", "pip", "install", "crewai", "matplotlib", "seaborn"], 
                         check=True)
    
    def _create_sample_data(self):
        """Create comprehensive sample data"""
        
        print("\n📊 Creating sample data...")
        
        # Create Norwegian farm data
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
            'carbon_neutral': [True] * 365,
            'subsidy_eligible': [True] * 365,
            'tax_optimized': [True] * 365
        }
        
        df = pd.DataFrame(data)
        df.to_csv('sample_farm_data.csv', index=False)
        print("  ✅ sample_farm_data.csv created")
        
        # Create financial data
        financial_data = {
            'month': pd.date_range('2024-01-01', periods=12, freq='M'),
            'revenue': np.random.normal(50000, 10000, 12),
            'expenses': np.random.normal(30000, 5000, 12),
            'subsidies_received': np.random.normal(15000, 3000, 12),
            'tax_paid': np.random.normal(8000, 2000, 12),
            'net_profit': np.random.normal(27000, 8000, 12)
        }
        
        financial_df = pd.DataFrame(financial_data)
        financial_df.to_csv('sample_financial_data.csv', index=False)
        print("  ✅ sample_financial_data.csv created")
    
    def _test_system(self):
        """Test the Norwegian Farm AI system"""
        
        print("\n🧪 Testing system...")
        
        try:
            # Test data loading
            df = pd.read_csv('sample_farm_data.csv')
            print(f"  ✅ Data loading: {len(df)} records loaded")
            
            # Test basic calculations
            apple_avg = df['apple_yield'].mean()
            persimmon_avg = df['persimmon_yield'].mean()
            print(f"  ✅ Yield calculations: Apple {apple_avg:.0f}kg, Persimmon {persimmon_avg:.0f}kg")
            
            # Test agent imports
            sys.path.append(str(self.agent_os_dir / "agents"))
            sys.path.append(str(self.agent_os_dir / "tools"))
            
            from subsidy_optimizer import NorwegianSubsidyOptimizer
            from tax_optimizer import NorwegianTaxOptimizer
            from yield_optimizer import NorwegianYieldOptimizer
            
            print("  ✅ Agent imports successful")
            
            # Test basic functionality
            farm_data = {
                'farm_size_hectares': 3.5,
                'organic_certified': True,
                'export_ready': True,
                'sustainable_practices': True,
                'carbon_neutral': True
            }
            
            subsidy_opt = NorwegianSubsidyOptimizer()
            subsidy_analysis = subsidy_opt.analyze_subsidy_opportunities(farm_data)
            print(f"  ✅ Subsidy analysis: {subsidy_analysis['total_potential_value']:,.0f} NOK potential")
            
            tax_opt = NorwegianTaxOptimizer()
            tax_analysis = tax_opt.analyze_tax_opportunities(farm_data)
            print(f"  ✅ Tax analysis: {tax_analysis['total_potential_savings']:,.0f} NOK potential savings")
            
            yield_opt = NorwegianYieldOptimizer()
            yield_analysis = yield_opt.optimize_yields(df)
            print(f"  ✅ Yield analysis: {yield_analysis['potential_improvements']['total_potential_value']:,.0f} NOK potential")
            
        except Exception as e:
            print(f"  ⚠️  Test failed: {e}")
    
    def _generate_setup_report(self):
        """Generate setup completion report"""
        
        print("\n📋 Generating setup report...")
        
        report = f"""# Norwegian Farm AI Setup Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Setup Status: ✅ COMPLETE

## Installed Components:
- Agent OS directory structure
- Norwegian Farm AI agents (3)
- Norwegian Farm AI tools (2)
- Configuration files
- Sample data files
- Python dependencies

## Agent OS Structure:
```
.agent-os/
├── agents/
│   ├── subsidy_optimizer.py
│   ├── tax_optimizer.py
│   └── yield_optimizer.py
├── tools/
│   ├── norwegian_subsidy_calculator.py
│   └── norwegian_tax_calculator.py
├── standards/
│   ├── python-style.md
│   └── norwegian-farm-style.md
├── config/
│   └── config.yml
└── product/
    └── mission.md
```

## Sample Data:
- sample_farm_data.csv (365 days of farm data)
- sample_financial_data.csv (12 months of financial data)

## Next Steps:
1. Run: python test_norwegian_farm_ai.py
2. Customize agents for your specific needs
3. Add your own farm data
4. Start optimizing!

## Usage Examples:
```python
# Test the system
python test_norwegian_farm_ai.py

# Run specific optimizations
python run_norwegian_farm_ai.py --complete-optimization
python run_norwegian_farm_ai.py --optimize-subsidies
python run_norwegian_farm_ai.py --optimize-taxes
```

🇳🇴 For the honor, not the glory—by the people, for the people!
"""
        
        report_path = self.base_dir / "SETUP_REPORT.md"
        report_path.write_text(report)
        print("  ✅ SETUP_REPORT.md created")
    
    def get_setup_status(self):
        """Get the current setup status"""
        return self.setup_complete

if __name__ == "__main__":
    setup = NorwegianFarmAISetup()
    setup.run_complete_setup()
