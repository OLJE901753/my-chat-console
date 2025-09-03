from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from typing import List
import os
from dotenv import load_dotenv
import yaml

# Load environment variables
load_dotenv()

# LLM Configuration Strategy from the prompt
# Primary Configuration (80% of agents use Groq)
groq_llm_primary = ChatGroq(
    model="groq/llama-3.1-70b-versatile",
    temperature=0.1,
    max_tokens=4000,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# Groq configuration for simpler agents
groq_llm_simple = ChatGroq(
    model="groq/llama-3.1-8b-instant", 
    temperature=0.1,
    max_tokens=2000,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# OpenAI for strategic management
openai_llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.2,
    max_tokens=4000,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

class FarmAiCrew:
    """Advanced Farm Management Crew using Hybrid LLM Approach"""

    def __init__(self):
        # Load configurations
        self.agents_config = self._load_config('agents.yaml')
        self.tasks_config = self._load_config('tasks.yaml')
        
        # Initialize agents
        self.agents = self._create_agents()
        self.tasks = self._create_tasks()

    def _load_config(self, filename):
        """Load YAML configuration file"""
        # Get the directory where this script is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # The config files are in the config subdirectory of the current directory
        config_path = os.path.join(current_dir, 'config', filename)
        config_path = os.path.abspath(config_path)
        
        print(f"Loading config from: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as file:
            content = yaml.safe_load(file)
            print(f"Loaded {filename}: type={type(content)}, keys={list(content.keys()) if isinstance(content, dict) else 'Not a dict'}")
            return content

    def _create_agents(self):
        """Create all agents with hybrid LLM assignments"""
        print("Creating agents...")
        print(f"Agents config type: {type(self.agents_config)}")
        print(f"Agents config keys: {list(self.agents_config.keys())}")
        
        agents = []
        
        try:
            # Farm Manager - OpenAI GPT-4 for strategic intelligence
            print("Creating farm_manager agent...")
            farm_manager_config = self.agents_config['farm_manager']
            print(f"Farm manager config type: {type(farm_manager_config)}")
            print(f"Farm manager config: {farm_manager_config}")
            
            farm_manager = Agent(
                config=farm_manager_config,
                llm=openai_llm,
                verbose=True,
                allow_delegation=True,
                max_iter=3,
                memory=True
            )
            agents.append(farm_manager)
            print("✅ Farm manager agent created")
            
            # Crop Health Specialist - Groq 70B for complex analysis
            print("Creating crop_health_specialist agent...")
            crop_health_config = self.agents_config['crop_health_specialist']
            print(f"Crop health config type: {type(crop_health_config)}")
            
            crop_health = Agent(
                config=crop_health_config,
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(crop_health)
            print("✅ Crop health specialist agent created")
            
            # Continue with other agents...
            print("Creating remaining agents...")
            
            # Irrigation Engineer - Groq 70B for complex calculations
            agents.append(Agent(
                config=self.agents_config['irrigation_engineer'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            ))
            
            # Weather Intelligence - Groq 70B for data correlation
            agents.append(Agent(
                config=self.agents_config['weather_intelligence'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            ))
            
            # Computer Vision Expert - Groq 70B for image analysis
            agents.append(Agent(
                config=self.agents_config['computer_vision_expert'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            ))
            
            # Predictive Maintenance - Groq 70B for pattern recognition
            agents.append(Agent(
                config=self.agents_config['predictive_maintenance'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            ))
            
            # Data Analytics - Groq 70B for complex analysis
            agents.append(Agent(
                config=self.agents_config['data_analytics'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            ))
            
            # Drone Operations - Groq 70B for mission planning
            agents.append(Agent(
                config=self.agents_config['drone_operations'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            ))
            
            # Content Creation - Groq 8B for simpler tasks
            agents.append(Agent(
                config=self.agents_config['content_creation'],
                llm=groq_llm_simple,
                verbose=True,
                memory=True
            ))
            
            # Customer Service - Groq 8B for standard support
            agents.append(Agent(
                config=self.agents_config['customer_service'],
                llm=groq_llm_simple,
                verbose=True,
                memory=True
            ))
            
            print(f"✅ All {len(agents)} agents created successfully")
            return agents
            
        except Exception as e:
            print(f"❌ Error creating agents: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise

    def _create_tasks(self):
        """Create all tasks"""
        print("Creating tasks...")
        print(f"Tasks config type: {type(self.tasks_config)}")
        print(f"Tasks config keys: {list(self.tasks_config.keys())}")
        
        tasks = []
        
        try:
            print("Creating daily_operations_task...")
            daily_task_config = self.tasks_config['daily_operations_task']
            print(f"Daily task config type: {type(daily_task_config)}")
            
            # Try using the Task constructor with the correct format
            daily_task = Task(
                description=daily_task_config['description'],
                expected_output=daily_task_config['expected_output'],
                output_file='daily_operations_plan.md'
            )
            tasks.append(daily_task)
            print("✅ Daily operations task created")
            
            print("Creating remaining tasks...")
            
            # Crisis Management Task
            crisis_config = self.tasks_config['crisis_management_task']
            tasks.append(Task(
                description=crisis_config['description'],
                expected_output=crisis_config['expected_output'],
                output_file='crisis_response_plan.md'
            ))
            
            # Strategic Planning Task
            strategic_config = self.tasks_config['strategic_planning_task']
            tasks.append(Task(
                description=strategic_config['description'],
                expected_output=strategic_config['expected_output'],
                output_file='strategic_plan.md'
            ))
            
            # Crop Health Assessment
            crop_config = self.tasks_config['crop_health_assessment']
            tasks.append(Task(
                description=crop_config['description'],
                expected_output=crop_config['expected_output'],
                output_file='crop_health_report.md'
            ))
            
            # Irrigation Optimization
            irrigation_config = self.tasks_config['irrigation_optimization']
            tasks.append(Task(
                description=irrigation_config['description'],
                expected_output=irrigation_config['expected_output'],
                output_file='irrigation_schedule.md'
            ))
            
            # Weather Analysis
            weather_config = self.tasks_config['weather_analysis']
            tasks.append(Task(
                description=weather_config['description'],
                expected_output=weather_config['expected_output'],
                output_file='weather_intelligence.md'
            ))
            
            # Drone Mission Planning
            drone_config = self.tasks_config['drone_mission_planning']
            tasks.append(Task(
                description=drone_config['description'],
                expected_output=drone_config['expected_output'],
                output_file='drone_mission_plan.md'
            ))
            
            # Content Generation
            content_config = self.tasks_config['content_generation']
            tasks.append(Task(
                description=content_config['description'],
                expected_output=content_config['expected_output'],
                output_file='content_strategy.md'
            ))
            
            # Predictive Maintenance
            maintenance_config = self.tasks_config['predictive_maintenance']
            tasks.append(Task(
                description=maintenance_config['description'],
                expected_output=maintenance_config['expected_output'],
                output_file='maintenance_schedule.md'
            ))
            
            # Data Analytics Report
            analytics_config = self.tasks_config['data_analytics_report']
            tasks.append(Task(
                description=analytics_config['description'],
                expected_output=analytics_config['expected_output'],
                output_file='analytics_report.md'
            ))
            
            print(f"✅ All {len(tasks)} tasks created successfully")
            return tasks
            
        except Exception as e:
            print(f"❌ Error creating tasks: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise

    def create_main_crew(self):
        """Creates the Advanced Farm Management Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.hierarchical,  # Hierarchical process for farm management
            manager_agent=self.agents[0],  # Farm Manager (GPT-4) manages the crew
            memory=True,
            cache=True,
            max_execution_time=600,  # 10 minutes max execution time
            verbose=True
        )

    def create_daily_operations_crew(self):
        """Crew focused on daily farm operations"""
        return Crew(
            agents=[
                self.agents[0],  # farm_manager
                self.agents[1],  # crop_health_specialist
                self.agents[2],  # irrigation_engineer
                self.agents[3],  # weather_intelligence
                self.agents[7]   # drone_operations
            ],
            tasks=[
                self.tasks[0],  # daily_operations_task
                self.tasks[3],  # crop_health_assessment
                self.tasks[4],  # irrigation_optimization
                self.tasks[5],  # weather_analysis
                self.tasks[6]   # drone_mission_planning
            ],
            process=Process.hierarchical,
            manager_agent=self.agents[0],  # farm_manager
            memory=True,
            verbose=True
        )

    def create_crisis_response_crew(self):
        """Crew for emergency situations"""
        return Crew(
            agents=[
                self.agents[0],  # farm_manager
                self.agents[3],  # weather_intelligence
                self.agents[7],  # drone_operations
                self.agents[1],  # crop_health_specialist
                self.agents[2]   # irrigation_engineer
            ],
            tasks=[
                self.tasks[1],  # crisis_management_task
                self.tasks[5],  # weather_analysis
                self.tasks[6]   # drone_mission_planning
            ],
            process=Process.hierarchical,
            manager_agent=self.agents[0],  # farm_manager
            memory=True,
            verbose=True
        )

    def create_content_creation_crew(self):
        """Crew focused on content creation and marketing"""
        return Crew(
            agents=[
                self.agents[8],  # content_creation
                self.agents[7],  # drone_operations
                self.agents[4],  # computer_vision_expert
                self.agents[6]   # data_analytics
            ],
            tasks=[
                self.tasks[7],  # content_generation
                self.tasks[6],  # drone_mission_planning
                self.tasks[9]   # data_analytics_report
            ],
            process=Process.sequential,
            verbose=True
        )
