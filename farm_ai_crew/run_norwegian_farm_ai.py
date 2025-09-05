#!/usr/bin/env python3
"""
Norwegian Farm AI - Main Integration Script

This script integrates Agent OS standards with CrewAI to create a powerful
Norwegian farm optimization system that maximizes subsidies and outsmarts bureaucracy.

Usage:
    python run_norwegian_farm_ai.py --farm-data farm_data.csv
    python run_norwegian_farm_ai.py --optimize-subsidies
    python run_norwegian_farm_ai.py --export-tax-data
"""

import argparse
import pandas as pd
import numpy as np
from datetime import datetime
import logging
import sys
import os

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from farm_ai_crew.norwegian_delegator import NorwegianFarmDelegator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('norwegian_farm_ai.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_sample_farm_data() -> pd.DataFrame:
    """Create sample Norwegian farm data for testing."""
    np.random.seed(42)  # For reproducible results
    
    data = {
        'date': pd.date_range('2024-01-01', periods=365, freq='D'),
        'temperature': np.random.normal(15, 5, 365),
        'precipitation': np.random.exponential(2, 365),
        'soil_moisture': np.random.uniform(0.3, 0.8, 365),
        'apple_yield': np.random.normal(1000, 200, 365),
        'persimmon_yield': np.random.normal(800, 150, 365),
        'organic_certified': [True] * 365,
        'farm_size_hectares': [3.5] * 365,  # Small farm for exemptions
        'export_ready': [True] * 365,
        'sustainable_practices': [True] * 365,
        'carbon_neutral': [True] * 365,
        'biodiversity_enhanced': [True] * 365,
        'precision_agriculture': [True] * 365,
        'digital_farming': [True] * 365
    }
    
    return pd.DataFrame(data)

def load_farm_data(file_path: str) -> pd.DataFrame:
    """Load farm data from CSV file."""
    try:
        data = pd.read_csv(file_path)
        logger.info(f"Loaded farm data from {file_path}: {len(data)} records")
        return data
    except Exception as e:
        logger.error(f"Error loading farm data: {e}")
        raise

def optimize_subsidies(farm_data: pd.DataFrame) -> Dict:
    """Optimize farm operations for maximum Norwegian subsidies."""
    logger.info("Starting subsidy optimization...")
    
    delegator = NorwegianFarmDelegator()
    
    # Run the optimization
    result = delegator.run_farm_optimization(farm_data)
    
    if result['status'] == 'success':
        logger.info("Subsidy optimization completed successfully")
        
        # Calculate total potential subsidies
        total_subsidies = sum(delegator.subsidy_rules.values()) * 100000  # Base calculation
        
        print("🇳🇴 Norwegian Farm AI - Subsidy Optimization Results:")
        print("=" * 60)
        print(f"✅ Status: {result['status']}")
        print(f"💰 Estimated Total Subsidies: {total_subsidies:,.0f} NOK")
        print(f"📊 Audit Log Entries: {len(result['audit_log'])}")
        print(f"🔧 Subsidy Rules Applied: {len(delegator.subsidy_rules)}")
        
        # Show individual subsidy categories
        print("\n📋 Subsidy Breakdown:")
        for rule, value in delegator.subsidy_rules.items():
            if isinstance(value, (int, float)):
                print(f"  • {rule.replace('_', ' ').title()}: {value:.1%}")
        
        return result
    else:
        logger.error(f"Subsidy optimization failed: {result['error']}")
        print(f"❌ Error: {result['error']}")
        return result

def export_tax_data(farm_data: pd.DataFrame) -> None:
    """Export farm data in Norwegian tax reporting format."""
    logger.info("Exporting tax data for Skattemelding...")
    
    delegator = NorwegianFarmDelegator()
    tax_data = delegator.export_for_skattemelding()
    
    # Save to CSV
    output_file = f"skattemelding_data_{datetime.now().strftime('%Y%m%d')}.csv"
    tax_data.to_csv(output_file, index=False)
    
    print("🇳🇴 Norwegian Farm AI - Tax Data Export:")
    print("=" * 50)
    print(f"✅ Tax data exported to: {output_file}")
    print(f"📊 Records: {len(tax_data)}")
    print(f"📅 Date Range: {tax_data['date'].min()} to {tax_data['date'].max()}")
    print(f"💰 Total Income: {tax_data['income_nok'].sum():,.0f} NOK")
    print(f"💸 Total Expenses: {tax_data['expenses_nok'].sum():,.0f} NOK")
    print(f"🎁 Subsidy Income: {tax_data['subsidy_income_nok'].sum():,.0f} NOK")
    print(f"📝 Deductible Expenses: {tax_data['deductible_expenses_nok'].sum():,.0f} NOK")
    
    logger.info(f"Tax data exported successfully to {output_file}")

def run_complete_optimization(farm_data: pd.DataFrame) -> None:
    """Run complete farm optimization process."""
    logger.info("Running complete Norwegian farm optimization...")
    
    print("🇳🇴 Norwegian Farm AI - Complete Optimization")
    print("=" * 60)
    print("🚀 Starting optimization process...")
    
    # Step 1: Subsidy Optimization
    print("\n1️⃣ Optimizing for Norwegian subsidies...")
    subsidy_result = optimize_subsidies(farm_data)
    
    # Step 2: Tax Data Export
    print("\n2️⃣ Exporting tax data for Skattemelding...")
    export_tax_data(farm_data)
    
    # Step 3: Audit Report
    print("\n3️⃣ Generating audit report...")
    delegator = NorwegianFarmDelegator()
    audit_log = delegator.get_audit_log()
    
    print(f"\n📋 Audit Report:")
    print(f"  • Total Operations: {len(audit_log)}")
    print(f"  • Successful Operations: {len([log for log in audit_log if log.get('status') == 'success'])}")
    print(f"  • Failed Operations: {len([log for log in audit_log if log.get('status') == 'failed'])}")
    
    print("\n✅ Complete optimization finished!")
    print("🎯 Ready for Norwegian farming success!")

def main():
    """Main function to run the Norwegian Farm AI system."""
    parser = argparse.ArgumentParser(description='Norwegian Farm AI - Optimize for subsidies and outsmart bureaucracy')
    parser.add_argument('--farm-data', type=str, help='Path to farm data CSV file')
    parser.add_argument('--optimize-subsidies', action='store_true', help='Optimize for Norwegian subsidies')
    parser.add_argument('--export-tax-data', action='store_true', help='Export data for Skattemelding')
    parser.add_argument('--complete-optimization', action='store_true', help='Run complete optimization process')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load farm data
    if args.farm_data:
        farm_data = load_farm_data(args.farm_data)
    else:
        print("📊 Using sample farm data...")
        farm_data = create_sample_farm_data()
    
    # Run requested operations
    if args.complete_optimization:
        run_complete_optimization(farm_data)
    elif args.optimize_subsidies:
        optimize_subsidies(farm_data)
    elif args.export_tax_data:
        export_tax_data(farm_data)
    else:
        # Default: run complete optimization
        run_complete_optimization(farm_data)

if __name__ == "__main__":
    main()
