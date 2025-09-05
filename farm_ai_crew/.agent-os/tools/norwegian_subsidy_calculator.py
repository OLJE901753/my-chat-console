"""
Norwegian Subsidy Calculator Tool
Calculates potential subsidies and grants for Norwegian farms
"""

from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class NorwegianSubsidyCalculator:
    """Tool for calculating Norwegian farm subsidies and grants"""
    
    def __init__(self):
        self.subsidy_programs = {
            "organic_certification": {
                "base_amount": 50000,  # NOK per year
                "requirements": ["organic_practices", "certification", "documentation"],
                "multiplier": 1.0
            },
            "carbon_neutral": {
                "base_amount": 75000,  # NOK per year
                "requirements": ["carbon_footprint_analysis", "renewable_energy", "offsetting"],
                "multiplier": 1.0
            },
            "export_grants": {
                "base_amount": 100000,  # NOK per year
                "requirements": ["export_certification", "quality_standards", "market_research"],
                "multiplier": 1.0
            },
            "innovation_grants": {
                "base_amount": 200000,  # NOK per project
                "requirements": ["innovative_technology", "research_proposal", "partnerships"],
                "multiplier": 1.0
            },
            "sustainability_grants": {
                "base_amount": 30000,  # NOK per year
                "requirements": ["water_conservation", "soil_health", "biodiversity"],
                "multiplier": 1.0
            },
            "small_farm_support": {
                "base_amount": 25000,  # NOK per year
                "requirements": ["farm_size_under_5_hectares", "family_farm", "local_markets"],
                "multiplier": 1.0
            },
            "climate_adaptation": {
                "base_amount": 150000,  # NOK per project
                "requirements": ["climate_risk_assessment", "adaptation_plan", "implementation"],
                "multiplier": 1.0
            }
        }
    
    def calculate_eligible_subsidies(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate all eligible subsidies for a farm"""
        
        eligible_subsidies = {}
        total_potential = 0
        
        for program_name, program_data in self.subsidy_programs.items():
            eligibility = self._check_eligibility(program_name, farm_data)
            
            if eligibility["eligible"]:
                amount = self._calculate_subsidy_amount(program_name, farm_data, program_data)
                eligible_subsidies[program_name] = {
                    "amount": amount,
                    "requirements_met": eligibility["requirements_met"],
                    "missing_requirements": eligibility["missing_requirements"],
                    "implementation_effort": eligibility["implementation_effort"]
                }
                total_potential += amount
        
        return {
            "eligible_subsidies": eligible_subsidies,
            "total_potential": total_potential,
            "recommendations": self._generate_subsidy_recommendations(eligible_subsidies)
        }
    
    def _check_eligibility(self, program_name: str, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check eligibility for a specific subsidy program"""
        
        program = self.subsidy_programs[program_name]
        requirements = program["requirements"]
        
        requirements_met = []
        missing_requirements = []
        
        # Check each requirement
        for requirement in requirements:
            if self._check_requirement(requirement, farm_data):
                requirements_met.append(requirement)
            else:
                missing_requirements.append(requirement)
        
        # Determine eligibility
        eligible = len(missing_requirements) == 0
        
        # Calculate implementation effort
        effort = self._calculate_implementation_effort(missing_requirements)
        
        return {
            "eligible": eligible,
            "requirements_met": requirements_met,
            "missing_requirements": missing_requirements,
            "implementation_effort": effort
        }
    
    def _check_requirement(self, requirement: str, farm_data: Dict[str, Any]) -> bool:
        """Check if a specific requirement is met"""
        
        requirement_checks = {
            "organic_practices": farm_data.get("organic_certified", False),
            "certification": farm_data.get("organic_certified", False),
            "documentation": True,  # Assume documentation is available
            "carbon_footprint_analysis": farm_data.get("carbon_neutral", False),
            "renewable_energy": farm_data.get("carbon_neutral", False),
            "offsetting": farm_data.get("carbon_neutral", False),
            "export_certification": farm_data.get("export_ready", False),
            "quality_standards": farm_data.get("export_ready", False),
            "market_research": True,  # Assume market research is available
            "innovative_technology": True,  # Assume innovation is possible
            "research_proposal": True,  # Assume research proposal is possible
            "partnerships": True,  # Assume partnerships are possible
            "water_conservation": farm_data.get("sustainable_practices", False),
            "soil_health": farm_data.get("sustainable_practices", False),
            "biodiversity": farm_data.get("sustainable_practices", False),
            "farm_size_under_5_hectares": farm_data.get("farm_size_hectares", 0) < 5,
            "family_farm": True,  # Assume family farm
            "local_markets": True,  # Assume local markets
            "climate_risk_assessment": True,  # Assume climate assessment is possible
            "adaptation_plan": True,  # Assume adaptation plan is possible
            "implementation": True  # Assume implementation is possible
        }
        
        return requirement_checks.get(requirement, False)
    
    def _calculate_subsidy_amount(self, program_name: str, farm_data: Dict[str, Any], program_data: Dict[str, Any]) -> float:
        """Calculate the subsidy amount for a program"""
        
        base_amount = program_data["base_amount"]
        multiplier = program_data["multiplier"]
        
        # Apply farm size multiplier for certain programs
        if program_name in ["organic_certification", "sustainability_grants"]:
            farm_size = farm_data.get("farm_size_hectares", 1)
            multiplier *= min(farm_size / 3.5, 2.0)  # Cap at 2x for larger farms
        
        # Apply export multiplier
        if program_name in ["export_grants", "innovation_grants"] and farm_data.get("export_ready", False):
            multiplier *= 1.5
        
        return base_amount * multiplier
    
    def _calculate_implementation_effort(self, missing_requirements: List[str]) -> str:
        """Calculate the effort required to meet missing requirements"""
        
        if not missing_requirements:
            return "none"
        
        effort_scores = {
            "organic_practices": 3,
            "certification": 2,
            "documentation": 1,
            "carbon_footprint_analysis": 3,
            "renewable_energy": 4,
            "offsetting": 2,
            "export_certification": 3,
            "quality_standards": 2,
            "market_research": 2,
            "innovative_technology": 4,
            "research_proposal": 3,
            "partnerships": 2,
            "water_conservation": 2,
            "soil_health": 2,
            "biodiversity": 2,
            "climate_risk_assessment": 3,
            "adaptation_plan": 3,
            "implementation": 4
        }
        
        total_effort = sum(effort_scores.get(req, 2) for req in missing_requirements)
        
        if total_effort <= 3:
            return "low"
        elif total_effort <= 6:
            return "medium"
        else:
            return "high"
    
    def _generate_subsidy_recommendations(self, eligible_subsidies: Dict[str, Any]) -> List[str]:
        """Generate recommendations for subsidy optimization"""
        
        recommendations = []
        
        # Sort by amount (highest first)
        sorted_subsidies = sorted(eligible_subsidies.items(), key=lambda x: x[1]["amount"], reverse=True)
        
        for program_name, data in sorted_subsidies:
            if data["implementation_effort"] == "none":
                recommendations.append(
                    f"✅ {program_name.replace('_', ' ').title()}: "
                    f"{data['amount']:,.0f} NOK (Ready to apply)"
                )
            else:
                recommendations.append(
                    f"🔄 {program_name.replace('_', ' ').title()}: "
                    f"{data['amount']:,.0f} NOK (Effort: {data['implementation_effort']})"
                )
        
        return recommendations
    
    def calculate_roi(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate return on investment for subsidy applications"""
        
        subsidy_analysis = self.calculate_eligible_subsidies(farm_data)
        
        # Estimate application costs
        application_costs = {
            "low": 5000,    # NOK
            "medium": 15000,  # NOK
            "high": 30000    # NOK
        }
        
        total_cost = 0
        total_benefit = 0
        
        for program_name, data in subsidy_analysis["eligible_subsidies"].items():
            effort = data["implementation_effort"]
            cost = application_costs.get(effort, 10000)
            benefit = data["amount"]
            
            total_cost += cost
            total_benefit += benefit
        
        roi = ((total_benefit - total_cost) / total_cost * 100) if total_cost > 0 else 0
        
        return {
            "total_investment": total_cost,
            "total_benefit": total_benefit,
            "net_benefit": total_benefit - total_cost,
            "roi_percentage": roi,
            "payback_period": "1 year" if roi > 100 else "2-3 years"
        }
