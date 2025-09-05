from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from typing import List
import os
from dotenv import load_dotenv
import yaml
from pathlib import Path
from .memory_store import JsonMemoryStore

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
        self.agent_by_name = {}
        # Fallback persistent memory store (JSON-based)
        self.memory_store = JsonMemoryStore()
        # Track task -> output file and task -> agent mappings for ingestion
        self.task_output_map: dict[str, str] = {}
        self.task_agent_map: dict[str, str] = {}
        self.agents = self._create_agents()
        self.tasks = self._create_tasks()

    def _ensure_memory_storage(self) -> None:
        """Ensure CrewAI/Chroma persistent storage is available and writable.

        Falls back to a local project directory: ./.crew_storage/chroma
        and exports CREWAI_STORAGE_PATH so CrewAI uses it.
        """
        # Respect explicit env var if set; otherwise choose a safe OS-specific default
        if os.getenv("CREWAI_STORAGE_PATH"):
            storage_path = Path(os.getenv("CREWAI_STORAGE_PATH"))
        else:
            if os.name == "nt":
                base = Path(os.getenv("LOCALAPPDATA", str(Path.home())))
                storage_path = base / "crewai_storage" / "chroma"
            else:
                storage_path = Path.home() / ".crewai_storage" / "chroma"
        storage_path.mkdir(parents=True, exist_ok=True)
        os.environ["CREWAI_STORAGE_PATH"] = str(storage_path.resolve())

    def _has_chroma(self) -> bool:
        """Return True if chromadb is importable; False otherwise."""
        try:
            import chromadb  # noqa: F401
            return True
        except Exception:
            return False

    def _create_crew_with_memory(self, *, agents: list, tasks: list, process: Process, manager_agent: Agent | None = None, verbose: bool = True) -> Crew:
        """Create a Crew with memory when available, otherwise disable and rely on JSON fallback.

        When Chroma is absent or fails to initialize, we set memory=False and inject
        recent JSON-based memory into each task's description.
        """
        self._ensure_memory_storage()
        use_memory = True
        if os.getenv("FARM_AI_DISABLE_CHROMA") == "1" or not self._has_chroma():
            use_memory = False
        if use_memory:
            try:
                return Crew(
                    agents=agents,
                    tasks=tasks,
                    process=process,
                    manager_agent=manager_agent,
                    memory=True,
                    cache=True,
                    verbose=verbose,
                )
            except Exception as e:
                # Retry once with a more conservative absolute path if sqlite can't open the DB
                if "unable to open database file" in str(e).lower():
                    if os.name == "nt":
                        fallback = Path("C:/crewai_storage/chroma")
                    else:
                        fallback = Path.home() / ".crewai_storage" / "chroma"
                    try:
                        fallback.mkdir(parents=True, exist_ok=True)
                        os.environ["CREWAI_STORAGE_PATH"] = str(fallback.resolve())
                        return Crew(
                            agents=agents,
                            tasks=tasks,
                            process=process,
                            manager_agent=manager_agent,
                            memory=True,
                            cache=True,
                            verbose=verbose,
                        )
                    except Exception:
                        # Fall through to JSON fallback
                        use_memory = False
                else:
                    # Any other initialization failure → JSON fallback
                    use_memory = False
        # JSON fallback path
        return Crew(
            agents=agents,
            tasks=tasks,
            process=process,
            manager_agent=manager_agent,
            memory=False,
            cache=True,
            verbose=verbose,
        )

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
            self.agent_by_name['farm_manager'] = farm_manager
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
            self.agent_by_name['crop_health_specialist'] = crop_health
            print("✅ Crop health specialist agent created")
            
            # Continue with other agents...
            print("Creating remaining agents...")
            
            # Irrigation Engineer - Groq 70B for complex calculations
            irrigation_engineer = Agent(
                config=self.agents_config['irrigation_engineer'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(irrigation_engineer)
            self.agent_by_name['irrigation_engineer'] = irrigation_engineer
            
            # Weather Intelligence - Groq 70B for data correlation
            weather_intelligence = Agent(
                config=self.agents_config['weather_intelligence'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(weather_intelligence)
            self.agent_by_name['weather_intelligence'] = weather_intelligence
            
            # Computer Vision Expert - Groq 70B for image analysis
            computer_vision_expert = Agent(
                config=self.agents_config['computer_vision_expert'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(computer_vision_expert)
            self.agent_by_name['computer_vision_expert'] = computer_vision_expert
            
            # Predictive Maintenance - Groq 70B for pattern recognition
            predictive_maintenance = Agent(
                config=self.agents_config['predictive_maintenance'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(predictive_maintenance)
            self.agent_by_name['predictive_maintenance'] = predictive_maintenance
            
            # Data Analytics - Groq 70B for complex analysis
            data_analytics = Agent(
                config=self.agents_config['data_analytics'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(data_analytics)
            self.agent_by_name['data_analytics'] = data_analytics
            
            # Drone Operations - Groq 70B for mission planning
            drone_operations = Agent(
                config=self.agents_config['drone_operations'],
                llm=groq_llm_primary,
                verbose=True,
                memory=True
            )
            agents.append(drone_operations)
            self.agent_by_name['drone_operations'] = drone_operations
            
            # Content Creation - Groq 8B for simpler tasks
            content_creation = Agent(
                config=self.agents_config['content_creation'],
                llm=groq_llm_simple,
                verbose=True,
                memory=True
            )
            agents.append(content_creation)
            self.agent_by_name['content_creation'] = content_creation
            
            # Customer Service - Groq 8B for standard support
            customer_service = Agent(
                config=self.agents_config['customer_service'],
                llm=groq_llm_simple,
                verbose=True,
                memory=True
            )
            agents.append(customer_service)
            self.agent_by_name['customer_service'] = customer_service
            
            print(f"✅ All {len(agents)} agents created successfully")
            return agents
            
        except Exception as e:
            print(f"❌ Error creating agents: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise

    def _create_tasks(self):
        """Create all tasks and bind them to agents from YAML via agent_by_name mapping"""
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
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            daily_task_config.get('agent', 'farm_manager'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + daily_task_config['description'],
                expected_output=daily_task_config['expected_output'],
                output_file='daily_operations_plan.md',
                agent=self.agent_by_name.get(daily_task_config.get('agent', 'farm_manager'))
            )
            tasks.append(daily_task)
            self.task_output_map['daily_operations_task'] = 'daily_operations_plan.md'
            self.task_agent_map['daily_operations_task'] = daily_task_config.get('agent', 'farm_manager')
            print("✅ Daily operations task created")
            
            print("Creating remaining tasks...")
            
            # Crisis Management Task
            crisis_config = self.tasks_config['crisis_management_task']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            crisis_config.get('agent', 'farm_manager'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + crisis_config['description'],
                expected_output=crisis_config['expected_output'],
                output_file='crisis_response_plan.md',
                agent=self.agent_by_name.get(crisis_config.get('agent', 'farm_manager'))
            ))
            self.task_output_map['crisis_management_task'] = 'crisis_response_plan.md'
            self.task_agent_map['crisis_management_task'] = crisis_config.get('agent', 'farm_manager')
            
            # Strategic Planning Task
            strategic_config = self.tasks_config['strategic_planning_task']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            strategic_config.get('agent', 'farm_manager'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + strategic_config['description'],
                expected_output=strategic_config['expected_output'],
                output_file='strategic_plan.md',
                agent=self.agent_by_name.get(strategic_config.get('agent', 'farm_manager'))
            ))
            self.task_output_map['strategic_planning_task'] = 'strategic_plan.md'
            self.task_agent_map['strategic_planning_task'] = strategic_config.get('agent', 'farm_manager')
            
            # Crop Health Assessment
            crop_config = self.tasks_config['crop_health_assessment']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            crop_config.get('agent', 'crop_health_specialist'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + crop_config['description'],
                expected_output=crop_config['expected_output'],
                output_file='crop_health_report.md',
                agent=self.agent_by_name.get(crop_config.get('agent', 'crop_health_specialist'))
            ))
            self.task_output_map['crop_health_assessment'] = 'crop_health_report.md'
            self.task_agent_map['crop_health_assessment'] = crop_config.get('agent', 'crop_health_specialist')
            
            # Irrigation Optimization
            irrigation_config = self.tasks_config['irrigation_optimization']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            irrigation_config.get('agent', 'irrigation_engineer'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + irrigation_config['description'],
                expected_output=irrigation_config['expected_output'],
                output_file='irrigation_schedule.md',
                agent=self.agent_by_name.get(irrigation_config.get('agent', 'irrigation_engineer'))
            ))
            self.task_output_map['irrigation_optimization'] = 'irrigation_schedule.md'
            self.task_agent_map['irrigation_optimization'] = irrigation_config.get('agent', 'irrigation_engineer')
            
            # Weather Analysis
            weather_config = self.tasks_config['weather_analysis']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            weather_config.get('agent', 'weather_intelligence'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + weather_config['description'],
                expected_output=weather_config['expected_output'],
                output_file='weather_intelligence.md',
                agent=self.agent_by_name.get(weather_config.get('agent', 'weather_intelligence'))
            ))
            self.task_output_map['weather_analysis'] = 'weather_intelligence.md'
            self.task_agent_map['weather_analysis'] = weather_config.get('agent', 'weather_intelligence')
            
            # Drone Mission Planning
            drone_config = self.tasks_config['drone_mission_planning']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            drone_config.get('agent', 'drone_operations'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + drone_config['description'],
                expected_output=drone_config['expected_output'],
                output_file='drone_mission_plan.md',
                agent=self.agent_by_name.get(drone_config.get('agent', 'drone_operations'))
            ))
            self.task_output_map['drone_mission_planning'] = 'drone_mission_plan.md'
            self.task_agent_map['drone_mission_planning'] = drone_config.get('agent', 'drone_operations')
            
            # Content Generation
            content_config = self.tasks_config['content_generation']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            content_config.get('agent', 'content_creation'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + content_config['description'],
                expected_output=content_config['expected_output'],
                output_file='content_strategy.md',
                agent=self.agent_by_name.get(content_config.get('agent', 'content_creation'))
            ))
            self.task_output_map['content_generation'] = 'content_strategy.md'
            self.task_agent_map['content_generation'] = content_config.get('agent', 'content_creation')
            
            # Predictive Maintenance
            maintenance_config = self.tasks_config['predictive_maintenance']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            maintenance_config.get('agent', 'predictive_maintenance'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + maintenance_config['description'],
                expected_output=maintenance_config['expected_output'],
                output_file='maintenance_schedule.md',
                agent=self.agent_by_name.get(maintenance_config.get('agent', 'predictive_maintenance'))
            ))
            self.task_output_map['predictive_maintenance'] = 'maintenance_schedule.md'
            self.task_agent_map['predictive_maintenance'] = maintenance_config.get('agent', 'predictive_maintenance')
            
            # Data Analytics Report
            analytics_config = self.tasks_config['data_analytics_report']
            tasks.append(Task(
                description=(
                    (
                        self.memory_store.load_agent_memory_text(
                            analytics_config.get('agent', 'data_analytics'), limit=10
                        ) + "\n\n"
                    )
                    if self.memory_store else ""
                ) + analytics_config['description'],
                expected_output=analytics_config['expected_output'],
                output_file='analytics_report.md',
                agent=self.agent_by_name.get(analytics_config.get('agent', 'data_analytics'))
            ))
            self.task_output_map['data_analytics_report'] = 'analytics_report.md'
            self.task_agent_map['data_analytics_report'] = analytics_config.get('agent', 'data_analytics')
            
            print(f"✅ All {len(tasks)} tasks created successfully")
            return tasks
            
        except Exception as e:
            print(f"❌ Error creating tasks: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise

    def _ingest_outputs_to_memory(self) -> None:
        """Read output files generated by tasks and append to persistent JSON memory."""
        for task_key, filename in self.task_output_map.items():
            agent_key = self.task_agent_map.get(task_key)
            if not agent_key:
                continue
            try:
                path = Path(filename).resolve()
                if not path.exists():
                    continue
                content = path.read_text(encoding='utf-8', errors='ignore')
                self.memory_store.append_agent_entry(
                    agent_key,
                    inputs=None,
                    result=content,
                    summary=None,
                    tasks_involved=[task_key],
                    agents_involved=[agent_key],
                )
            except Exception:
                # Never break the run because of memory ingestion
                continue

    def run_daily_operations_with_memory(self, inputs: dict) -> str:
        """Convenience wrapper: create daily crew, run kickoff, and ingest outputs into JSON memory."""
        crew = self.create_daily_operations_crew()
        result = crew.kickoff(inputs=inputs)
        try:
            self._ingest_outputs_to_memory()
        finally:
            pass
        return str(result)

    def create_main_crew(self):
        """Creates the Advanced Farm Management Crew"""
        return self._create_crew_with_memory(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_agent=self.agents[0],
            verbose=True,
        )

    def create_daily_operations_crew(self):
        """Crew focused on daily farm operations"""
        return self._create_crew_with_memory(
            agents=[
                self.agents[0],
                self.agents[1],
                self.agents[2],
                self.agents[3],
                self.agents[7],
            ],
            tasks=[
                self.tasks[0],
                self.tasks[3],
                self.tasks[4],
                self.tasks[5],
                self.tasks[6],
            ],
            process=Process.hierarchical,
            manager_agent=self.agents[0],
            verbose=True,
        )

    def create_crisis_response_crew(self):
        """Crew for emergency situations"""
        return self._create_crew_with_memory(
            agents=[
                self.agents[0],
                self.agents[3],
                self.agents[7],
                self.agents[1],
                self.agents[2],
            ],
            tasks=[
                self.tasks[1],
                self.tasks[5],
                self.tasks[6],
            ],
            process=Process.hierarchical,
            manager_agent=self.agents[0],
            verbose=True,
        )

    def create_content_creation_crew(self):
        """Crew focused on content creation and marketing"""
        return self._create_crew_with_memory(
            agents=[
                self.agents[8],
                self.agents[7],
                self.agents[4],
                self.agents[6],
            ],
            tasks=[
                self.tasks[7],
                self.tasks[6],
                self.tasks[9],
            ],
            process=Process.sequential,
            verbose=True,
        )
