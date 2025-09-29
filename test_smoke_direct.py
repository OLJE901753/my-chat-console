#!/usr/bin/env python3
"""
Direct smoke test for coordinator - bypasses pytest
"""
import os
import time
import uuid
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_coordinator_smoke():
    print("🧪 Starting coordinator smoke test...")
    
    supabase_url = os.environ.get("COORDINATOR_SUPABASE_URL")
    supabase_key = os.environ.get("COORDINATOR_SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment")
        print(f"URL: {bool(supabase_url)}")
        print(f"KEY: {bool(supabase_key)}")
        return False
    
    print("✅ Supabase credentials found")
    
    try:
        client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created")
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        return False

    task_id = str(uuid.uuid4())
    user_id = None
    print(f"📝 Creating task with ID: {task_id}")

    try:
        # Enqueue task
        result = client.table("ai_tasks").insert({
            "task_id": task_id,
            "task_type": "strategic_planning",
            "payload": {"farm_location": "Test Farm"},
            "user_id": user_id,
            "trace_id": task_id,
            "priority": 0,
        }).execute()
        print("✅ Task inserted into ai_tasks table")
        print(f"   Insert result: {result.data}")
    except Exception as e:
        print(f"❌ Failed to insert task: {e}")
        return False

    # Poll for experiment creation
    print("⏳ Waiting for coordinator to process task...")
    exp_id = None
    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            res = client.table("experiments").select("id, metadata").eq("metadata->>task_id", task_id).execute()
            if res.data:
                exp_id = res.data[0]["id"]
                print(f"✅ Experiment created with ID: {exp_id}")
                break
        except Exception as e:
            print(f"⚠️ Error checking experiments: {e}")
        time.sleep(2)

    if not exp_id:
        print("❌ Experiment not created by coordinator within 60 seconds")
        return False

    # Poll for completion log
    print("⏳ Waiting for task completion...")
    done = False
    deadline = time.time() + 120
    while time.time() < deadline:
        try:
            res = client.table("experiment_logs").select("level, message").eq("experiment_id", exp_id).order("created_at").execute()
            msgs = [r["message"] for r in res.data]
            print(f"📋 Log messages: {msgs}")
            if any(m in ("task_completed", "task_failed") for m in msgs):
                done = True
                print("✅ Task completed!")
                break
        except Exception as e:
            print(f"⚠️ Error checking logs: {e}")
        time.sleep(2)

    if not done:
        print("❌ Coordinator did not finish the task within timeout")
        return False
    
    print("🎉 Smoke test PASSED!")
    return True

if __name__ == "__main__":
    success = test_coordinator_smoke()
    exit(0 if success else 1)
