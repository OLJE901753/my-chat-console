# Norwegian Farm Agent Python Style Standards

## Core Philosophy
**"Break dumb rules ethically, use money to win, optimize for Norwegian tax reporting"**

## Code Style Requirements

### 1. Data Processing
- **ALWAYS use pandas** for data manipulation and analysis
- **Optimize for speed** - Norwegian farmers don't have time for slow code
- **Use numpy** for mathematical operations and array processing
- **Implement caching** for frequently accessed data

### 2. Norwegian Tax Optimization
- **Structure data** for easy tax reporting (Skattemelding)
- **Track subsidies** and grants separately for deduction purposes
- **Document everything** for audit trails
- **Use Norwegian accounting standards** (NGAAP)

### 3. Bureaucracy Hacking
- **Always find loopholes** in agricultural regulations
- **Use buzzwords** that bureaucrats love: "sustainable", "carbon-neutral", "biodiversity"
- **Time operations** with subsidy application deadlines
- **Document "innovation"** for grant eligibility

### 4. Code Structure
```python
# Norwegian Hack: Always start with subsidy calculation
def calculate_subsidies(data: pd.DataFrame) -> float:
    """Calculate Norwegian agricultural subsidies with maximum efficiency."""
    # Implementation here
    pass

# Use type hints for better documentation
def optimize_yield(farm_data: pd.DataFrame, crop: str) -> Dict[str, float]:
    """Optimize crop yield while maximizing subsidy eligibility."""
    # Implementation here
    pass
```

### 5. Error Handling
- **Never fail silently** - Norwegian farmers need to know what went wrong
- **Log everything** for audit purposes
- **Implement fallbacks** for when subsidies don't work out
- **Use Norwegian error messages** when possible

### 6. Performance Optimization
- **Vectorize operations** using pandas/numpy
- **Use multiprocessing** for large datasets
- **Implement lazy loading** for big data
- **Cache expensive calculations**

### 7. Documentation Standards
- **Explain every hack** in comments
- **Document subsidy rules** and their workarounds
- **Include Norwegian translations** for key terms
- **Add audit trail** comments

### 8. Testing Requirements
- **Test with real Norwegian farm data**
- **Verify subsidy calculations** against official rules
- **Test edge cases** for bureaucracy workarounds
- **Performance benchmarks** for large datasets

## Example Code Template

```python
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, timedelta

class NorwegianFarmAgent:
    """
    Smart farm agent that outsmarts Norwegian bureaucracy.
    
    HACKS:
    - Uses subsidy optimization strategies
    - Implements tax-efficient data structures
    - Leverages small farm exemptions
    - Times operations with grant deadlines
    """
    
    def __init__(self):
        self.subsidy_rules = self._load_norwegian_subsidies()
        self.tax_optimization = True  # Always optimize for taxes
    
    def _load_norwegian_subsidies(self) -> Dict:
        """Load Norwegian subsidy rules with clever workarounds."""
        # Implementation with Norwegian subsidy hacks
        pass
    
    def optimize_for_subsidies(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Optimize farm data for maximum subsidy eligibility.
        
        NORWEGIAN HACK: Structure data to qualify for multiple grant categories
        """
        # Implementation here
        pass
```

## Banned Practices
- ❌ **Slow pandas operations** (use vectorization)
- ❌ **Hardcoded values** (use configuration)
- ❌ **Silent failures** (always log errors)
- ❌ **Ignoring subsidies** (always optimize for grants)
- ❌ **Poor documentation** (audit trails are crucial)

## Required Libraries
- `pandas` - Data manipulation
- `numpy` - Mathematical operations
- `scikit-learn` - Machine learning
- `matplotlib` - Visualization
- `requests` - API calls for subsidy data
- `logging` - Audit trails
- `typing` - Type hints for clarity

## Norwegian-Specific Requirements
- **Use Norwegian date formats** (DD.MM.YYYY)
- **Include currency formatting** (NOK with proper separators)
- **Implement Skattemelding compatibility**
- **Support Norwegian agricultural terminology**
- **Optimize for Norwegian weather patterns**

---
*"For the honor, not the glory—by the people, for the people."*
*Norwegian Farm Agent Standards v1.0*
