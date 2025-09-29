import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env file
load_dotenv()

class CoordinatorSettings:
    def __init__(self):
        self.coordinator_port = int(os.getenv("COORDINATOR_COORDINATOR_PORT", "8001"))
        self.supabase_url = os.getenv("COORDINATOR_SUPABASE_URL")
        self.supabase_service_role_key = os.getenv("COORDINATOR_SUPABASE_SERVICE_ROLE_KEY")
        self.supabase_realtime_schema = os.getenv("COORDINATOR_SUPABASE_REALTIME_SCHEMA", "public")
        self.supabase_channel = os.getenv("COORDINATOR_SUPABASE_CHANNEL", "ai_tasks")
        self.backend_ws_url = os.getenv("COORDINATOR_BACKEND_WS_URL")

def get_settings() -> CoordinatorSettings:
    return CoordinatorSettings()

