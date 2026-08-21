import os
import sys
from pathlib import Path
import uvicorn
from dotenv import load_dotenv

# Ensure the backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Explicitly load .env from backend directory
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "True").lower() in ("true", "1", "t")

    print(f"=== Starting CampusFix AI Backend on http://{host}:{port} ===")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload, app_dir=str(backend_dir))

