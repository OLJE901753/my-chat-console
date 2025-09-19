"""
Norwegian Tax Calculator Tool
Calculates tax optimization opportunities for Norwegian farms
"""

from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class NorwegianTaxCalculator:
    """Tool for calculating Norwegian farm tax optimization opportunities"""
    
    def __init__(self):
        self.tax_rates = {
            "income_tax": 0.22,  # 22% for income up to 200,000 NOK
            "income_tax_high": 0.25,  # 25% for income above 200,000 NOK
            "vat": 0.25,  # 25% VAT
            "social_security": 0.08  # 8% social security
        }
        
        self.deductions = {
            "depreciation": {
                "machinery": 0.20,  # 20% per year
                "buildings": 0.04,  # 4% per year
                "equipment": 0.30   # 30% per year
            },
            "operating_expenses": {
                "seeds_fertilizers": 1.0,  # 100% deductible
                "fuel": 1.0,  # 100% deductible
                "utilities": 1.0,  # 100% deductible
                "insurance": 1.0,  # 100% deductible
                "repairs": 1.0,  # 100% deductible
                "professional_services": 1.0  # 100% deductible
            },
            "investment_incentives": {
                "green_technology": 0.50,  # 50% bonus depreciation
                "digitalization": 0.30,  # 30% bonus depreciation
                "automation": 0.25  # 25% bonus depreciation
            }
        }
    
    def calculate_tax_optimization(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate tax optimization opportunities"""
        
        # Calculate current tax burden
        current_tax = self._calculate_current_tax(farm_data)
        
        # Calculate optimized tax burden
        optimized_tax = self._calculate_optimized_tax(farm_data)
        
        # Calculate savings
        tax_savings = current_tax - optimized_tax
        
        return {
            "current_tax_burden": current_tax,
            "optimized_tax_burden": optimized_tax,
            "tax_savings": tax_savings,
            "savings_percentage": (tax_savings / current_tax * 100) if current_tax > 0 else 0,
            "optimization_opportunities": self._identify_optimization_opportunities(farm_data),
            "recommendations": self._generate_tax_recommendations(farm_data)
        }
    
    def _calculate_current_tax(self, farm_data: Dict[str, Any]) -> float:
        """Calculate current tax burden"""
        
        # Estimate income based on yields
        apple_yield = farm_data.get("apple_yield", 1000)
        persimmon_yield = farm_data.get("persimmon_yield", 800)
        
        # Estimate revenue (50 NOK per kg for apples, 60 NOK per kg for persimmons)
        apple_revenue = apple_yield * 50
        persimmon_revenue = persimmon_yield * 60
        total_revenue = apple_revenue + persimmon_revenue
        
        # Estimate expenses (40% of revenue)
        total_expenses = total_revenue * 0.4
        
        # Calculate taxable income
        taxable_income = total_revenue - total_expenses
        
        # Calculate income tax
        if taxable_income <= 200000:
            income_tax = taxable_income * self.tax_rates["income_tax"]
        else:
            income_tax = (200000 * self.tax_rates["income_tax"] + 
                         (taxable_income - 200000) * self.tax_rates["income_tax_high"])
        
        # Calculate social security
        social_security = taxable_income * self.tax_rates["social_security"]
        
        # Calculate VAT (simplified)
        vat = total_revenue * self.tax_rates["vat"] * 0.1  # Assume 10% of revenue is VAT applicable
        
        return income_tax + social_security + vat
    
    def _calculate_optimized_tax(self, farm_data: Dict[str, Any]) -> float:
        """Calculate optimized tax burden"""
        
        # Estimate income based on yields
        apple_yield = farm_data.get("apple_yield", 1000)
        persimmon_yield = farm_data.get("persimmon_yield", 800)
        
        # Estimate revenue
        apple_revenue = apple_yield * 50
        persimmon_revenue = persimmon_yield * 60
        total_revenue = apple_revenue + persimmon_revenue
        
        # Optimized expenses (50% of revenue with better deduction strategy)
        total_expenses = total_revenue * 0.5
        
        # Apply investment incentives
        investment_deductions = self._calculate_investment_deductions(farm_data)
        
        # Calculate taxable income
        taxable_income = total_revenue - total_expenses - investment_deductions
        
        # Calculate income tax
        if taxable_income <= 200000:
            income_tax = taxable_income * self.tax_rates["income_tax"]
        else:
            income_tax = (200000 * self.tax_rates["income_tax"] + 
                         (taxable_income - 200000) * self.tax_rates["income_tax_high"])
        
        # Calculate social security
        social_security = taxable_income * self.tax_rates["social_security"]
        
        # Optimized VAT handling
        vat = total_revenue * self.tax_rates["vat"] * 0.05  # Better VAT optimization
        
        return income_tax + social_security + vat
    
    def _calculate_investment_deductions(self, farm_data: Dict[str, Any]) -> float:
        """Calculate investment deductions"""
        
        # Estimate investment value
        farm_size = farm_data.get("farm_size_hectares", 3.5)
        base_investment = farm_size * 100000  # 100,000 NOK per hectare
        
        # Apply investment incentives
        green_tech_deduction = base_investment * 0.2 * self.deductions["investment_incentives"]["green_technology"]
        digital_deduction = base_investment * 0.1 * self.deductions["investment_incentives"]["digitalization"]
        automation_deduction = base_investment * 0.1 * self.deductions["investment_incentives"]["automation"]
        
        return green_tech_deduction + digital_deduction + automation_deduction
    
    def _identify_optimization_opportunities(self, farm_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify specific tax optimization opportunities"""
        
        opportunities = []
        
        # Depreciation optimization
        opportunities.append({
            "category": "depreciation",
            "description": "Optimize depreciation schedule for machinery and equipment",
            "potential_savings": 25000,  # NOK per year
            "implementation_effort": "medium",
            "requirements": ["asset_valuation", "depreciation_schedule"]
        })
        
        # Expense deduction optimization
        opportunities.append({
            "category": "expense_deductions",
            "description": "Maximize deductible operating expenses",
            "potential_savings": 15000,  # NOK per year
            "implementation_effort": "low",
            "requirements": ["expense_tracking", "receipt_management"]
        })
        
        # Investment incentive optimization
        opportunities.append({
            "category": "investment_incentives",
            "description": "Leverage green technology and digitalization incentives",
            "potential_savings": 50000,  # NOK per year
            "implementation_effort": "high",
            "requirements": ["investment_planning", "technology_adoption"]
        })
        
        # VAT optimization
        opportunities.append({
            "category": "vat_optimization",
            "description": "Optimize VAT handling and reclaim opportunities",
            "potential_savings": 10000,  # NOK per year
            "implementation_effort": "medium",
            "requirements": ["vat_registration", "input_vat_tracking"]
        })
        
        # Income timing optimization
        opportunities.append({
            "category": "income_timing",
            "description": "Optimize income recognition timing for tax brackets",
            "potential_savings": 20000,  # NOK per year
            "implementation_effort": "low",
            "requirements": ["income_forecasting", "tax_planning"]
        })
        
        return opportunities
    
    def _generate_tax_recommendations(self, farm_data: Dict[str, Any]) -> List[str]:
        """Generate actionable tax recommendations"""
        
        recommendations = []
        
        # Depreciation recommendations
        recommendations.append(
            "📊 Implement accelerated depreciation for new equipment and machinery"
        )
        
        # Expense tracking recommendations
        recommendations.append(
            "📝 Implement comprehensive expense tracking system for maximum deductions"
        )
        
        # Investment recommendations
        recommendations.append(
            "🌱 Invest in green technology to qualify for 50% bonus depreciation"
        )
        
        # VAT recommendations
        recommendations.append(
            "💰 Optimize VAT handling to maximize input VAT reclaims"
        )
        
        # Income timing recommendations
        recommendations.append(
            "⏰ Implement income timing strategies to optimize tax brackets"
        )
        
        # Norwegian specific recommendations
        recommendations.append(
            "🇳🇴 Leverage Norwegian agricultural tax exemptions and incentives"
        )
        
        return recommendations
    
    def calculate_tax_impact_analysis(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive tax impact analysis"""
        
        optimization = self.calculate_tax_optimization(farm_data)
        
        # Calculate 5-year projection
        current_annual_tax = optimization["current_tax_burden"]
        optimized_annual_tax = optimization["optimized_tax_burden"]
        annual_savings = optimization["tax_savings"]
        
        five_year_savings = annual_savings * 5
        
        return {
            "current_annual_tax": current_annual_tax,
            "optimized_annual_tax": optimized_annual_tax,
            "annual_savings": annual_savings,
            "five_year_savings": five_year_savings,
            "savings_percentage": optimization["savings_percentage"],
            "roi": "500-1000%" if five_year_savings > 100000 else "200-500%",
            "implementation_timeline": "3-6 months",
            "risk_level": "low"
        }
