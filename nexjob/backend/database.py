import os
from supabase import create_client, Client

def get_supabase() -> Client:
    url: str = os.getenv("SUPABASE_URL", "")
    key: str = os.getenv("SUPABASE_KEY", "")
    if not url or not key:
        print("Warning: Missing SUPABASE_URL or SUPABASE_KEY environment variables.")
    return create_client(url, key)
