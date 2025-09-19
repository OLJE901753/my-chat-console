"""
Norwegian Farm Yield Optimizer Agent
Optimizes crop yields for apple and persimmon operations
"""

from crewai import Agent, Task, Crew
from typing import Dict, List, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import re

class NorwegianYieldOptimizer:
    """Agent specialized in optimizing Norwegian farm yields"""
    
    def __init__(self):
        self.agent = Agent(
            role="Norwegian Yield Optimization Expert",
            goal="Maximize crop yields through data-driven optimization and Norwegian farming techniques",
            backstory="""You are a brilliant Norwegian agricultural scientist who specializes in 
            yield optimization for apple and persimmon operations. You combine traditional 
            Norwegian farming wisdom with cutting-edge data science to maximize crop yields 
            while maintaining sustainability and quality. You know every trick to get the 
            most out of Norwegian soil and climate.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.apple_model = None
        self.persimmon_model = None
    
    def optimize_yields(self, farm_data: pd.DataFrame) -> Dict[str, Any]:
        """Optimize yields based on farm data"""
        
        # Train models if not already trained
        if self.apple_model is None or self.persimmon_model is None:
            self._train_models(farm_data)
        
        # Analyze current yields
        current_analysis = self._analyze_current_yields(farm_data)
        
        # Generate optimization recommendations
        recommendations = self._generate_yield_recommendations(farm_data, current_analysis)
        
        # Calculate potential improvements
        improvements = self._calculate_potential_improvements(farm_data, recommendations)
        
        return {
            "current_analysis": current_analysis,
            "recommendations": recommendations,
            "potential_improvements": improvements,
            "optimization_strategy": self._create_optimization_strategy(recommendations)
        }
    
    def _train_models(self, farm_data: pd.DataFrame):
        """Train machine learning models for yield prediction"""
        
        # Prepare features for apple yield prediction
        apple_features = ['temperature', 'precipitation', 'soil_moisture']
        X_apple = farm_data[apple_features]
        y_apple = farm_data['apple_yield']
        
        # Train apple model
        self.apple_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.apple_model.fit(X_apple, y_apple)
        
        # Prepare features for persimmon yield prediction
        persimmon_features = ['temperature', 'precipitation', 'soil_moisture']
        X_persimmon = farm_data[persimmon_features]
        y_persimmon = farm_data['persimmon_yield']
        
        # Train persimmon model
        self.persimmon_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.persimmon_model.fit(X_persimmon, y_persimmon)
    
    def _analyze_current_yields(self, farm_data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze current yield performance"""
        
        apple_stats = {
            "mean_yield": farm_data['apple_yield'].mean(),
            "std_yield": farm_data['apple_yield'].std(),
            "max_yield": farm_data['apple_yield'].max(),
            "min_yield": farm_data['apple_yield'].min(),
            "trend": self._calculate_trend(farm_data['apple_yield'])
        }
        
        persimmon_stats = {
            "mean_yield": farm_data['persimmon_yield'].mean(),
            "std_yield": farm_data['persimmon_yield'].std(),
            "max_yield": farm_data['persimmon_yield'].max(),
            "min_yield": farm_data['persimmon_yield'].min(),
            "trend": self._calculate_trend(farm_data['persimmon_yield'])
        }
        
        return {
            "apple": apple_stats,
            "persimmon": persimmon_stats,
            "overall_performance": self._assess_overall_performance(apple_stats, persimmon_stats)
        }
    
    def _calculate_trend(self, yields: pd.Series) -> str:
        """Calculate yield trend"""
        if len(yields) < 2:
            return "insufficient_data"
        
        # Simple linear trend calculation
        x = np.arange(len(yields))
        slope = np.polyfit(x, yields, 1)[0]
        
        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"
    
    def _assess_overall_performance(self, apple_stats: Dict, persimmon_stats: Dict) -> str:
        """Assess overall farm performance"""
        apple_trend = apple_stats["trend"]
        persimmon_trend = persimmon_stats["trend"]
        
        if apple_trend == "increasing" and persimmon_trend == "increasing":
            return "excellent"
        elif apple_trend == "increasing" or persimmon_trend == "increasing":
            return "good"
        elif apple_trend == "stable" and persimmon_trend == "stable":
            return "average"
        else:
            return "needs_improvement"
    
    def _generate_yield_recommendations(self, farm_data: pd.DataFrame, analysis: Dict) -> List[Dict]:
        """Generate yield optimization recommendations"""
        recommendations = []
        
        # Soil moisture optimization
        avg_moisture = farm_data['soil_moisture'].mean()
        if avg_moisture < 0.5:
            recommendations.append({
                "category": "irrigation",
                "priority": "high",
                "description": "Increase irrigation to optimize soil moisture",
                "expected_improvement": "15-20%",
                "implementation": "Install drip irrigation system"
            })
        
        # Temperature optimization
        avg_temp = farm_data['temperature'].mean()
        if avg_temp < 12:
            recommendations.append({
                "category": "climate",
                "priority": "medium",
                "description": "Consider greenhouse or polytunnel for temperature control",
                "expected_improvement": "10-15%",
                "implementation": "Install climate control systems"
            })
        
        # Precipitation optimization
        avg_precip = farm_data['precipitation'].mean()
        if avg_precip < 1.5:
            recommendations.append({
                "category": "water_management",
                "priority": "high",
                "description": "Implement water conservation and storage",
                "expected_improvement": "20-25%",
                "implementation": "Build water storage and implement conservation techniques"
            })
        
        # Norwegian specific recommendations
        recommendations.extend(self._get_norwegian_specific_recommendations(farm_data))
        
        return recommendations
    
    def _get_norwegian_specific_recommendations(self, farm_data: pd.DataFrame) -> List[Dict]:
        """Get Norwegian-specific farming recommendations"""
        return [
            {
                "category": "norwegian_techniques",
                "priority": "high",
                "description": "Implement Norwegian permaculture techniques",
                "expected_improvement": "25-30%",
                "implementation": "Apply traditional Norwegian farming wisdom with modern technology"
            },
            {
                "category": "subsidy_optimization",
                "priority": "high",
                "description": "Optimize for Norwegian subsidy requirements",
                "expected_improvement": "Financial: 100,000+ NOK",
                "implementation": "Align farming practices with subsidy criteria"
            },
            {
                "category": "export_optimization",
                "priority": "medium",
                "description": "Optimize for Norwegian export standards",
                "expected_improvement": "Market access: 200,000+ NOK",
                "implementation": "Implement export-ready quality standards"
            }
        ]
    
    def _calculate_potential_improvements(self, farm_data: pd.DataFrame, recommendations: List[Dict]) -> Dict[str, Any]:
        """Calculate potential yield improvements"""
        
        total_improvement = 0
        financial_impact = 0
        
        for rec in recommendations:
            if "expected_improvement" in rec:
                improvement = rec["expected_improvement"]
                if "%" in improvement:
                    # Extract percentage
                    pct = float(improvement.split("%")[0].split("-")[0])
                    total_improvement += pct
                elif "NOK" in improvement:
                    # Extract numeric NOK amount robustly (handles prefixes like 'Financial:' and commas/plus signs)
                    match = re.search(r"([0-9][0-9.,]*)", improvement)
                    if match:
                        amount_str = match.group(1).replace(",", "")
                        try:
                            financial_impact += float(amount_str)
                        except ValueError:
                            pass
        
        # Calculate potential yield increases
        current_apple_yield = farm_data['apple_yield'].mean()
        current_persimmon_yield = farm_data['persimmon_yield'].mean()
        
        potential_apple_increase = current_apple_yield * (total_improvement / 100)
        potential_persimmon_increase = current_persimmon_yield * (total_improvement / 100)
        
        return {
            "yield_improvement_percentage": total_improvement,
            "potential_apple_increase": potential_apple_increase,
            "potential_persimmon_increase": potential_persimmon_increase,
            "financial_impact": financial_impact,
            "total_potential_value": (potential_apple_increase + potential_persimmon_increase) * 50 + financial_impact  # 50 NOK per kg estimate
        }
    
    def _create_optimization_strategy(self, recommendations: List[Dict]) -> Dict[str, Any]:
        """Create a comprehensive optimization strategy"""
        
        high_priority = [r for r in recommendations if r.get("priority") == "high"]
        medium_priority = [r for r in recommendations if r.get("priority") == "medium"]
        
        return {
            "immediate_actions": high_priority,
            "medium_term_actions": medium_priority,
            "implementation_timeline": "3-6 months",
            "expected_roi": "300-500%",
            "risk_level": "low"
        }
