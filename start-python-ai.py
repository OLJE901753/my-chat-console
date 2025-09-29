#!/usr/bin/env python
"""
Startup script for Farm AI Crew FastAPI server
"""

import sys
import os
from pathlib import Path

# Add the farm_ai_crew src to Python path
farm_ai_crew_src = Path(__file__).parent / "farm_ai_crew" / "src"
sys.path.insert(0, str(farm_ai_crew_src))

try:
    from farm_ai_crew.api import run_server
    
    if __name__ == "__main__":
        print("Starting Farm AI Crew FastAPI server...")
        print("Server will be available at http://localhost:8000")
        print("API docs at http://localhost:8000/docs")
        print("Press Ctrl+C to stop")
        
        run_server(host="0.0.0.0", port=8000)
        
except ImportError as e:
    print(f"ERROR: Failed to import Farm AI Crew: {e}")
    print("SOLUTION: Make sure you have installed the requirements:")
    print("   cd farm_ai_crew && pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Failed to start server: {e}")
    sys.exit(1)
