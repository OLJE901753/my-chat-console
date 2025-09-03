#!/usr/bin/env python
import sys
import warnings
from datetime import datetime
from farm_ai_crew.crew import FarmAiCrew

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

def run_daily_operations():
    """
    Run the daily operations crew for routine farm management.
    """
    print("🚜 Starting Daily Farm Operations Crew...")
    
    inputs = {
        'current_date': datetime.now().strftime('%Y-%m-%d'),
        'farm_location': 'Apple Orchard Farm',
        'current_season': 'Fall',
        'priority_focus': 'Harvest preparation and disease monitoring'
    }
    
    try:
        crew = FarmAiCrew().daily_operations_crew()
        result = crew.kickoff(inputs=inputs)
        print("✅ Daily operations completed successfully!")
        return result
    except Exception as e:
        print(f"❌ Error in daily operations: {e}")
        raise

def run_crisis_response(emergency_type="weather_alert"):
    """
    Run the crisis response crew for emergency situations.
    """
    print(f"🚨 Starting Crisis Response Crew for: {emergency_type}")
    
    inputs = {
        'emergency_type': emergency_type,
        'current_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'farm_location': 'Apple Orchard Farm',
        'severity_level': 'high'
    }
    
    try:
        crew = FarmAiCrew().crisis_response_crew()
        result = crew.kickoff(inputs=inputs)
        print("✅ Crisis response plan executed successfully!")
        return result
    except Exception as e:
        print(f"❌ Error in crisis response: {e}")
        raise

def run_content_creation():
    """
    Run the content creation crew for marketing and communications.
    """
    print("📱 Starting Content Creation Crew...")
    
    inputs = {
        'content_focus': 'Drone footage and farm operations',
        'target_platforms': ['Instagram', 'TikTok', 'YouTube'],
        'content_type': 'Educational and engaging farm content',
        'current_date': datetime.now().strftime('%Y-%m-%d')
    }
    
    try:
        crew = FarmAiCrew().content_creation_crew()
        result = crew.kickoff(inputs=inputs)
        print("✅ Content creation completed successfully!")
        return result
    except Exception as e:
        print(f"❌ Error in content creation: {e}")
        raise

def run_strategic_planning():
    """
    Run the full crew for strategic planning and long-term farm strategy.
    """
    print("🎯 Starting Strategic Planning Crew...")
    
    inputs = {
        'planning_horizon': '12 months',
        'farm_location': 'Apple Orchard Farm',
        'current_year': str(datetime.now().year),
        'focus_areas': ['Yield optimization', 'Cost reduction', 'Market expansion']
    }
    
    try:
        crew = FarmAiCrew().crew()
        result = crew.kickoff(inputs=inputs)
        print("✅ Strategic planning completed successfully!")
        return result
    except Exception as e:
        print(f"❌ Error in strategic planning: {e}")
        raise

def run_full_crew():
    """
    Run the complete farm management crew for comprehensive operations.
    """
    print("🌾 Starting Full Farm Management Crew...")
    
    inputs = {
        'farm_location': 'Apple Orchard Farm',
        'current_date': datetime.now().strftime('%Y-%m-%d'),
        'operation_mode': 'comprehensive',
        'priority_level': 'high'
    }
    
    try:
        crew = FarmAiCrew().crew()
        result = crew.kickoff(inputs=inputs)
        print("✅ Full farm management completed successfully!")
        return result
    except Exception as e:
        print(f"❌ Error in full crew execution: {e}")
        raise

def main():
    """
    Main function to run different farm management operations.
    """
    if len(sys.argv) < 2:
        print("🌾 Farm AI Crew Management System")
        print("Usage:")
        print("  python main.py daily          - Run daily operations")
        print("  python main.py crisis         - Run crisis response")
        print("  python main.py content        - Run content creation")
        print("  python main.py strategic      - Run strategic planning")
        print("  python main.py full           - Run full crew")
        print("  python main.py test           - Run test mode")
        return
    
    operation = sys.argv[1].lower()
    
    try:
        if operation == "daily":
            run_daily_operations()
        elif operation == "crisis":
            emergency_type = sys.argv[2] if len(sys.argv) > 2 else "weather_alert"
            run_crisis_response(emergency_type)
        elif operation == "content":
            run_content_creation()
        elif operation == "strategic":
            run_strategic_planning()
        elif operation == "full":
            run_full_crew()
        elif operation == "test":
            print("🧪 Running test mode...")
            # Run a simple test with minimal inputs
            inputs = {'test_mode': True, 'farm_location': 'Test Farm'}
            crew = FarmAiCrew().daily_operations_crew()
            result = crew.kickoff(inputs=inputs)
            print("✅ Test completed successfully!")
        else:
            print(f"❌ Unknown operation: {operation}")
            print("Available operations: daily, crisis, content, strategic, full, test")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
