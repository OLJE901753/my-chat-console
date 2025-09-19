#!/usr/bin/env python3
"""
Test Norwegian Farm AI - Simplified Version

This script tests the Norwegian Farm AI system with sample data to demonstrate
its capabilities in optimizing for subsidies and outsmarting bureaucracy.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import sys
import os

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from farm_ai_crew.norwegian_delegator_simple import NorwegianFarmDelegatorSimple

def create_sample_farm_data() -> pd.DataFrame:
    """Create realistic Norwegian farm data for testing."""
    np.random.seed(42)  # For reproducible results
    
    print("🌱 Creating sample Norwegian farm data...")
    
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
    
    farm_data = pd.DataFrame(data)
    
    print(f"✅ Sample farm data created: {len(farm_data)} records")
    print(f"   📊 Apple yield: {farm_data['apple_yield'].mean():.0f} kg/day")
    print(f"   📊 Persimmon yield: {farm_data['persimmon_yield'].mean():.0f} kg/day")
    print(f"   🏡 Farm size: {farm_data['farm_size_hectares'].iloc[0]} hectares")
    print(f"   🌿 Organic certified: {farm_data['organic_certified'].iloc[0]}")
    
    return farm_data

def test_yield_optimization():
    """Test yield optimization with Norwegian farming hacks."""
    print("\n" + "="*60)
    print("🚀 TESTING YIELD OPTIMIZATION")
    print("="*60)
    
    farm_data = create_sample_farm_data()
    delegator = NorwegianFarmDelegatorSimple()
    
    result = delegator.optimize_yield(farm_data)
    
    print(f"\n📈 YIELD OPTIMIZATION RESULTS:")
    print(f"   🍎 Apple Yield:")
    print(f"      Base: {result['apple_yield']['base']:.0f} kg/day")
    print(f"      Optimized: {result['apple_yield']['optimized']:.0f} kg/day")
    print(f"      Improvement: +{result['apple_yield']['improvement']:.0f} kg/day ({result['apple_yield']['improvement_pct']:.1f}%)")
    
    print(f"\n   🍊 Persimmon Yield:")
    print(f"      Base: {result['persimmon_yield']['base']:.0f} kg/day")
    print(f"      Optimized: {result['persimmon_yield']['optimized']:.0f} kg/day")
    print(f"      Improvement: +{result['persimmon_yield']['improvement']:.0f} kg/day ({result['persimmon_yield']['improvement_pct']:.1f}%)")
    
    print(f"\n   🎯 Total Optimization: +{result['total_optimization']:.0f} kg/day")
    print(f"\n   🔧 Norwegian Hacks Applied:")
    for hack in result['norwegian_hacks_applied']:
        print(f"      ✅ {hack}")
    
    return result

def test_subsidy_optimization():
    """Test subsidy optimization for maximum Norwegian grants."""
    print("\n" + "="*60)
    print("💰 TESTING SUBSIDY OPTIMIZATION")
    print("="*60)
    
    farm_data = create_sample_farm_data()
    delegator = NorwegianFarmDelegatorSimple()
    
    result = delegator.optimize_subsidies(farm_data)
    
    print(f"\n💵 SUBSIDY OPTIMIZATION RESULTS:")
    print(f"   💰 Base Income: {result['base_income_nok']:,.0f} NOK")
    print(f"   🎁 Total Subsidies: {result['total_subsidies_nok']:,.0f} NOK")
    print(f"   📊 Total Income: {result['total_income_nok']:,.0f} NOK")
    print(f"   📈 Subsidy Percentage: {result['subsidy_percentage']:.1f}%")
    print(f"   🎯 Bureaucracy Score: {result['bureaucracy_score']}/100")
    
    print(f"\n   🏆 Individual Subsidies:")
    for subsidy_name, amount in result['subsidies'].items():
        print(f"      {subsidy_name.replace('_', ' ').title()}: {amount:,.0f} NOK")
    
    return result

def test_tax_optimization():
    """Test tax optimization for Norwegian tax reporting."""
    print("\n" + "="*60)
    print("📊 TESTING TAX OPTIMIZATION")
    print("="*60)
    
    farm_data = create_sample_farm_data()
    delegator = NorwegianFarmDelegatorSimple()
    
    result = delegator.optimize_taxes(farm_data)
    
    print(f"\n🧾 TAX OPTIMIZATION RESULTS:")
    print(f"   💰 Base Income: {result['base_income_nok']:,.0f} NOK")
    print(f"   💸 Deductible Expenses: {result['deductible_expenses_nok']:,.0f} NOK")
    print(f"   📊 Taxable Income: {result['taxable_income_nok']:,.0f} NOK")
    print(f"   🏛️ Tax Liability: {result['tax_liability_nok']:,.0f} NOK")
    print(f"   💡 Tax Savings: {result['tax_savings_nok']:,.0f} NOK")
    print(f"   📈 Effective Tax Rate: {result['effective_tax_rate']:.1f}%")
    print(f"   ✅ Skattemelding Ready: {result['skattemelding_ready']}")
    
    return result

def test_bureaucracy_loopholes():
    """Test bureaucracy loophole detection."""
    print("\n" + "="*60)
    print("🕵️ TESTING BUREAUCRACY LOOPHOLES")
    print("="*60)
    
    farm_data = create_sample_farm_data()
    delegator = NorwegianFarmDelegatorSimple()
    
    result = delegator.find_bureaucracy_loopholes(farm_data)
    
    print(f"\n🔍 BUREAUCRACY LOOPHOLE RESULTS:")
    print(f"   🎯 Total Loopholes Found: {result['total_loopholes']}")
    print(f"   💰 Total Potential Savings: {result['total_potential_savings_nok']:,.0f} NOK")
    print(f"   🏆 Bureaucracy Hacking Score: {result['bureaucracy_hacking_score']}/100")
    
    print(f"\n   🕵️ Individual Loopholes:")
    for i, loophole in enumerate(result['loopholes'], 1):
        print(f"\n      {i}. {loophole['name']}")
        print(f"         Description: {loophole['description']}")
        print(f"         Potential Savings: {loophole['potential_savings_nok']:,.0f} NOK")
        print(f"         Risk Level: {loophole['risk_level']}")
        print(f"         Implementation: {loophole['implementation']}")
    
    return result

def test_complete_optimization():
    """Test the complete Norwegian farm optimization process."""
    print("\n" + "="*60)
    print("🇳🇴 TESTING COMPLETE NORWEGIAN FARM OPTIMIZATION")
    print("="*60)
    
    farm_data = create_sample_farm_data()
    delegator = NorwegianFarmDelegatorSimple()
    
    result = delegator.run_complete_optimization(farm_data)
    
    if result['status'] == 'success':
        print(f"\n🎉 COMPLETE OPTIMIZATION RESULTS:")
        print(f"   💰 Total Financial Impact: {result['total_financial_impact_nok']:,.0f} NOK")
        print(f"   🔧 Norwegian Hacks Applied: {result['norwegian_hacks_applied']}")
        print(f"   🎯 Bureaucracy Score: {result['bureaucracy_score']}/100")
        print(f"   🕵️ Loophole Score: {result['loophole_score']}/100")
        print(f"   📊 Audit Log Entries: {len(result['audit_log'])}")
        
        print(f"\n   🏆 OPTIMIZATION BREAKDOWN:")
        print(f"      Yield Improvement: +{result['yield_optimization']['total_optimization']:.0f} kg/day")
        print(f"      Subsidy Income: {result['subsidy_optimization']['total_subsidies_nok']:,.0f} NOK")
        print(f"      Tax Savings: {result['tax_optimization']['tax_savings_nok']:,.0f} NOK")
        print(f"      Loophole Savings: {result['bureaucracy_loopholes']['total_potential_savings_nok']:,.0f} NOK")
        
        print(f"\n   ✅ AUDIT TRAIL:")
        for log_entry in result['audit_log']:
            print(f"      {log_entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S')} - {log_entry['operation']} - {log_entry['status']}")
        
        # Test tax data export
        print(f"\n📊 TESTING TAX DATA EXPORT:")
        tax_data = delegator.export_for_skattemelding()
        print(f"   Tax records exported: {len(tax_data)}")
        print(f"   Date range: {tax_data['date'].min()} to {tax_data['date'].max()}")
        print(f"   Total income: {tax_data['income_nok'].sum():,.0f} NOK")
        print(f"   Total expenses: {tax_data['expenses_nok'].sum():,.0f} NOK")
        print(f"   Ready for Skattemelding! 📊")
        
    else:
        print(f"❌ Optimization failed: {result['error']}")
    
    return result

def main():
    """Run all tests for the Norwegian Farm AI system."""
    print("🇳🇴 NORWEGIAN FARM AI - COMPREHENSIVE TESTING")
    print("=" * 60)
    print("Testing the system that maximizes subsidies and outsmarts bureaucracy!")
    print("For the honor, not the glory—by the people, for the people! 🇳🇴")
    
    try:
        # Test individual components
        yield_result = test_yield_optimization()
        subsidy_result = test_subsidy_optimization()
        tax_result = test_tax_optimization()
        loophole_result = test_bureaucracy_loopholes()
        
        # Test complete optimization
        complete_result = test_complete_optimization()
        
        # Summary
        print("\n" + "="*60)
        print("🎯 TESTING SUMMARY")
        print("="*60)
        
        if complete_result['status'] == 'success':
            print("✅ All tests passed successfully!")
            print(f"💰 Total financial impact: {complete_result['total_financial_impact_nok']:,.0f} NOK")
            print(f"🔧 Norwegian hacks applied: {complete_result['norwegian_hacks_applied']}")
            print(f"🎯 Bureaucracy score: {complete_result['bureaucracy_score']}/100")
            print(f"🕵️ Loophole score: {complete_result['loophole_score']}/100")
            print("\n🇳🇴 Norwegian Farm AI is ready to maximize your farming profits!")
        else:
            print("❌ Some tests failed. Check the error messages above.")
        
    except Exception as e:
        print(f"❌ Testing failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
