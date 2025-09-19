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
