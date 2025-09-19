#!/usr/bin/env python
"""
Test script for CrewAI Farm Management System
Tests the hybrid LLM approach without requiring API keys
"""

import sys
import os
from pathlib import Path

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def test_imports():
    """Test that all required packages can be imported"""
    print("🧪 Testing package imports...")
    
    try:
        import crewai
        print(f"✅ CrewAI: {crewai.__version__}")
    except ImportError as e:
        print(f"❌ CrewAI import failed: {e}")
        return False
    
    try:
        import langchain_groq
        print(f"✅ LangChain Groq: {langchain_groq.__version__}")
    except ImportError as e:
        print(f"❌ LangChain Groq import failed: {e}")
        return False
    
    try:
        import langchain_openai
        print("✅ LangChain OpenAI: imported")
    except ImportError as e:
        print(f"❌ LangChain OpenAI import failed: {e}")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✅ python-dotenv: imported")
    except ImportError as e:
        print(f"❌ python-dotenv import failed: {e}")
        return False
    
    return True

def test_config_files():
    """Test that configuration files exist and are valid"""
    print("\n📁 Testing configuration files...")
    
    config_dir = Path(__file__).parent / "src" / "farm_ai_crew" / "config"
    
    # Check agents.yaml
    agents_file = config_dir / "agents.yaml"
    if agents_file.exists():
        print("✅ agents.yaml: exists")
        try:
            import yaml
            with open(agents_file, 'r') as f:
                agents_config = yaml.safe_load(f)
            print(f"✅ agents.yaml: valid YAML with {len(agents_config)} agents")
        except Exception as e:
            print(f"❌ agents.yaml: YAML parsing failed - {e}")
            return False
    else:
        print("❌ agents.yaml: not found")
        return False
    
    # Check tasks.yaml
    tasks_file = config_dir / "tasks.yaml"
    if tasks_file.exists():
        print("✅ tasks.yaml: exists")
        try:
            with open(tasks_file, 'r') as f:
                tasks_config = yaml.safe_load(f)
            print(f"✅ tasks.yaml: valid YAML with {len(tasks_config)} tasks")
        except Exception as e:
            print(f"❌ tasks.yaml: YAML parsing failed - {e}")
            return False
    else:
        print("❌ tasks.yaml: not found")
        return False
    
    return True

def test_crew_structure():
    """Test that the crew structure can be loaded"""
    print("\n🏗️ Testing crew structure...")
    
    try:
        from farm_ai_crew.crew import FarmAiCrew
        print("✅ FarmAiCrew class: imported")
        
        # Test crew initialization (without API keys)
        crew = FarmAiCrew()
        print("✅ FarmAiCrew: initialized")
        
        # Test that agents and tasks were created
        if hasattr(crew, 'agents') and len(crew.agents) > 0:
            print(f"✅ Agents: {len(crew.agents)} agents created")
        else:
            print("❌ Agents: no agents created")
            return False
            
        if hasattr(crew, 'tasks') and len(crew.tasks) > 0:
            print(f"✅ Tasks: {len(crew.tasks)} tasks created")
        else:
            print("❌ Tasks: no tasks created")
            return False
        
        # Test crew creation methods exist
        required_methods = ['create_main_crew', 'create_daily_operations_crew', 'create_crisis_response_crew']
        for method in required_methods:
            if hasattr(crew, method):
                print(f"✅ Method {method}: exists")
            else:
                print(f"❌ Method {method}: missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Crew structure test failed: {e}")
        return False

def test_llm_configurations():
    """Test LLM configuration setup"""
    print("\n🤖 Testing LLM configurations...")
    
    try:
        from farm_ai_crew.crew import groq_llm_primary, groq_llm_simple, openai_llm
        
        print("✅ Groq 70B LLM: configured")
        print("✅ Groq 8B LLM: configured") 
        print("✅ OpenAI GPT-4 LLM: configured")
        
        # Test that the models are properly configured
        print(f"✅ Groq 70B model: {groq_llm_primary.model_name}")
        print(f"✅ Groq 8B model: {groq_llm_simple.model_name}")
        print(f"✅ OpenAI model: {openai_llm.model_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ LLM configuration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🌾 CrewAI Farm Management System - Test Suite")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_config_files,
        test_crew_structure,
        test_llm_configurations
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                print(f"❌ Test {test.__name__} failed")
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your CrewAI system is ready.")
        print("\n🚀 Next steps:")
        print("1. Set up your .env file with API keys")
        print("2. Run: python -m farm_ai_crew.main test")
        print("3. Try: python -m farm_ai_crew.main daily")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
