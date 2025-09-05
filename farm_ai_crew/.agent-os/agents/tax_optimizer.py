"""
Norwegian Farm Tax Optimizer Agent
Maximizes tax benefits and minimizes tax burden through legal strategies
"""

from crewai import Agent, Task, Crew
from typing import Dict, List, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class NorwegianTaxOptimizer:
    """Agent specialized in Norwegian farm tax optimization"""
    
    def __init__(self):
        self.agent = Agent(
            role="Norwegian Tax Optimization Expert",
            goal="Minimize tax burden and maximize tax benefits through legal strategies",
            backstory="""You are a cunning Norwegian tax expert who specializes in 
            agricultural tax optimization. You know every tax exemption, every 
            deduction opportunity, and every legal strategy to minimize tax burden 
            while maximizing benefits. You help farmers keep more of their hard-earned 
            money through smart tax planning.""",
            verbose=True,
            allow_delegation=False
        )
    
    def analyze_tax_opportunities(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze farm data for tax optimization opportunities"""
        
        opportunities = {
            "depreciation_optimization": self._check_depreciation_opportunities(farm_data),
            "expense_deductions": self._check_expense_deductions(farm_data),
            "investment_incentives": self._check_investment_incentives(farm_data),
            "vat_optimization": self._check_vat_optimization(farm_data),
            "income_timing": self._check_income_timing_opportunities(farm_data)
        }
        
        total_savings = sum(opp.get("potential_savings", 0) for opp in opportunities.values())
        
        return {
            "opportunities": opportunities,
            "total_potential_savings": total_savings,
            "recommendations": self._generate_tax_recommendations(opportunities)
        }
    
    def _check_depreciation_opportunities(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check depreciation optimization opportunities"""
        farm_size = farm_data.get("farm_size_hectares", 0)
        
        if farm_size > 0:
            potential_savings = farm_size * 5000  # NOK per hectare
            return {
                "status": "eligible",
                "current_savings": 0,
                "potential_savings": potential_savings,
                "action": "optimize_depreciation_schedule",
                "requirements": ["asset_valuation", "depreciation_schedule", "documentation"]
            }
        else:
            return {
                "status": "no_data",
                "current_savings": 0,
                "potential_savings": 0,
                "action": "provide_farm_size_data"
            }
    
    def _check_expense_deductions(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check expense deduction opportunities"""
        return {
            "status": "always_eligible",
            "current_savings": 0,
            "potential_savings": 50000,  # NOK per year
            "action": "maximize_expense_deductions",
            "requirements": ["receipt_tracking", "expense_categorization", "documentation"]
        }
    
    def _check_investment_incentives(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check investment incentive opportunities"""
        return {
            "status": "always_eligible",
            "current_savings": 0,
            "potential_savings": 100000,  # NOK per investment
            "action": "leverage_investment_incentives",
            "requirements": ["investment_planning", "incentive_application", "documentation"]
        }
    
    def _check_vat_optimization(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check VAT optimization opportunities"""
        return {
            "status": "always_eligible",
            "current_savings": 0,
            "potential_savings": 25000,  # NOK per year
            "action": "optimize_vat_handling",
            "requirements": ["vat_registration", "input_vat_tracking", "quarterly_reporting"]
        }
    
    def _check_income_timing_opportunities(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check income timing optimization opportunities"""
        return {
            "status": "always_eligible",
            "current_savings": 0,
            "potential_savings": 30000,  # NOK per year
            "action": "optimize_income_timing",
            "requirements": ["income_forecasting", "tax_bracket_analysis", "timing_strategy"]
        }
    
    def _generate_tax_recommendations(self, opportunities: Dict[str, Any]) -> List[str]:
        """Generate actionable tax recommendations"""
        recommendations = []
        
        for opp_name, opp_data in opportunities.items():
            if opp_data.get("potential_savings", 0) > 0:
                recommendations.append(
                    f"Implement {opp_name.replace('_', ' ').title()}: "
                    f"Potential savings {opp_data['potential_savings']:,} NOK"
                )
        
        return recommendations
    
    def calculate_tax_impact(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate the total tax impact of optimizations"""
        analysis = self.analyze_tax_opportunities(farm_data)
        
        return {
            "current_tax_burden": 200000,  # NOK per year (estimated)
            "optimized_tax_burden": 200000 - analysis["total_potential_savings"],
            "total_savings": analysis["total_potential_savings"],
            "savings_percentage": (analysis["total_potential_savings"] / 200000) * 100
        }
